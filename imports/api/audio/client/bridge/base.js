import logger from '/imports/startup/client/logger';
import {
  getAudioConstraints,
  doGUM,
} from '/imports/api/audio/client/bridge/service';

const BASE_BRIDGE_NAME = 'base';

export default class BaseAudioBridge {
  constructor(userData) {
    this.userData = userData;

    this.baseErrorCodes = {
      INVALID_TARGET: 'INVALID_TARGET',
      CONNECTION_ERROR: 'CONNECTION_ERROR',
      REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
      GENERIC_ERROR: 'GENERIC_ERROR',
      MEDIA_ERROR: 'MEDIA_ERROR',
      WEBRTC_NOT_SUPPORTED: 'WEBRTC_NOT_SUPPORTED',
      ICE_NEGOTIATION_FAILED: 'ICE_NEGOTIATION_FAILED',
    };

    this.baseCallStates = {
      started: 'started',
      ended: 'ended',
      failed: 'failed',
      reconnecting: 'reconnecting',
      autoplayBlocked: 'autoplayBlocked',
      audioPublished: 'audioPublished',
    };

    this.bridgeName = BASE_BRIDGE_NAME;
  }

  getPeerConnection() {
    console.error('The Bridge must implement getPeerConnection');
  }

  exitAudio() {
    console.error('The Bridge must implement exitAudio');
  }

  joinAudio(options, callback) {
    console.error('The Bridge must implement joinAudio');
  }

  changeInputDevice() {
    console.error('The Bridge must implement changeInputDevice');
  }

  setInputStream(inputStream, {
    deviceId = null,
    force = false,
  } = {}) {
    console.error('The Bridge must implement setInputStream');
  }

  sendDtmf() {
    console.error('The Bridge must implement sendDtmf');
  }

  set inputDeviceId (deviceId) {
    this._inputDeviceId = deviceId;
  }

  get inputDeviceId () {
    return this._inputDeviceId;
  }

  setSenderTrackEnabled(shouldEnable) {
    const peer = this.getPeerConnection();

    if (!peer) {
      logger.warn({
        logCode: 'base_audio_bridge_set_sender_track_no_peer',
        extraInfo: {
          bridgeName: this.bridgeName,
          shouldEnable,
        },
      }, 'BaseAudioBridge: setSenderTrackEnabled called but no peer connection available');
      return;
    }

    const senders = peer.getSenders();
    let enabledCount = 0;
    let disabledCount = 0;
    
    senders.forEach((sender) => {
      const { track } = sender;
      if (track && track.kind === 'audio') {
        track.enabled = shouldEnable;
        // Also ensure track is not muted (muted is different from enabled)
        // enabled controls whether audio is sent, muted is a separate state
        if (shouldEnable && track.muted) {
          // Note: track.muted is read-only, but we can log it for debugging
          logger.warn({
            logCode: 'base_audio_bridge_track_muted',
            extraInfo: {
              bridgeName: this.bridgeName,
              trackId: track.id,
              trackEnabled: track.enabled,
              trackMuted: track.muted,
              trackReadyState: track.readyState,
            },
          }, 'BaseAudioBridge: track is muted (read-only property)');
        }
        if (shouldEnable) {
          enabledCount++;
        } else {
          disabledCount++;
        }
      }
    });
    
    logger.info({
      logCode: 'base_audio_bridge_set_sender_track_result',
      extraInfo: {
        bridgeName: this.bridgeName,
        shouldEnable,
        sendersCount: senders.length,
        enabledCount,
        disabledCount,
      },
    }, `BaseAudioBridge: setSenderTrackEnabled(${shouldEnable}) - ${enabledCount} enabled, ${disabledCount} disabled`);
  }

  /* eslint-disable class-methods-use-this */
  supportsTransparentListenOnly() {
    return false;
  }

  /**
   * Change the input device with the given deviceId, without renegotiating
   * peer.
   * A new MediaStream object is created for the given deviceId. This object
   * is returned by the resolved promise.
   * @param  {String}  deviceId The id of the device to be set as input
   * @return {Promise}          A promise that is resolved with the MediaStream
   *                            object after changing the input device.
   */
  async liveChangeInputDevice(deviceId) {
    let newStream;
    let backupStream;

    try {
      // Remove all input audio tracks from the stream
      // This will effectively mute the microphone
      // and keep the audio output working
      if (deviceId === 'listen-only') {
        const stream = this.inputStream;
        if (stream) {
          // Get all tracks before stopping to ensure we stop all of them
          const tracks = stream.getAudioTracks();
          
          logger.info({
            logCode: 'base_audio_bridge_stopping_tracks_for_listenonly',
            extraInfo: {
              bridgeName: this.bridgeName,
              streamId: stream.id,
              trackCount: tracks.length,
            },
          }, `BaseAudioBridge: stopping ${tracks.length} audio track(s) for listen-only mode`);
          
          // Stop all audio tracks to release the microphone
          // This is critical to ensure the browser releases the mic
          // so it can be properly re-acquired when switching back to microphone
          tracks.forEach((track) => {
            if (track.readyState !== 'ended') {
              track.stop();
            }
            // Remove track from stream
            try {
              stream.removeTrack(track);
            } catch (error) {
              // Track might already be removed, ignore error
              logger.debug({
                logCode: 'base_audio_bridge_remove_track_error',
                extraInfo: {
                  bridgeName: this.bridgeName,
                  trackId: track.id,
                  errorMessage: error?.message,
                },
              }, 'BaseAudioBridge: error removing track (may already be removed)');
            }
          });
          
          logger.info({
            logCode: 'base_audio_bridge_stopped_tracks_for_listenonly',
            extraInfo: {
              bridgeName: this.bridgeName,
              streamId: stream.id,
              tracksStopped: tracks.length,
              remainingTracks: stream.getAudioTracks().length,
            },
          }, `BaseAudioBridge: stopped ${tracks.length} audio track(s) for listen-only mode`);
          
          // Clear the input stream reference to ensure a fresh stream is created
          // when switching back to microphone
          this.inputStream = null;
        }
        return null; // Return null to indicate no input stream for listen-only
      }

      const constraints = {
        audio: getAudioConstraints({ deviceId }),
      };

      // Backup stream (current one) in case the switch fails
      if (this.inputStream && this.inputStream.active) {
        backupStream = this.inputStream ? this.inputStream.clone() : null;
        this.inputStream.getAudioTracks().forEach((track) => track.stop());
      }

      newStream = await doGUM(constraints);
      
      // Ensure all tracks in the new stream are enabled before setting it as input stream
      // This is especially important when switching from listen-only to microphone
      newStream.getAudioTracks().forEach((track) => {
        if (track.readyState === 'live') {
          track.enabled = true;
        }
      });
      
      await this.setInputStream(newStream, { deviceId });
      
      // After setting the input stream, ensure tracks are still enabled
      // This is needed because setInputStream might replace tracks in the peer connection
      // and we want to make sure the new tracks are enabled
      if (newStream && newStream.active) {
        newStream.getAudioTracks().forEach((track) => {
          if (track.readyState === 'live') {
            track.enabled = true;
          }
        });
      }
      
      // Also ensure tracks in peer connection senders are enabled
      // This is critical because setInputStream uses replaceTrack, and the new track
      // might not be enabled even if the stream's track is enabled
      // Use multiple delays to ensure replaceTrack has completed and track is properly set
      setTimeout(() => {
        this.setSenderTrackEnabled(true);
        // Also check and enable tracks in the stream again
        if (newStream && newStream.active) {
          newStream.getAudioTracks().forEach((track) => {
            if (track.readyState === 'live') {
              track.enabled = true;
            }
          });
        }
      }, 100);
      
      // Second attempt after a longer delay to ensure everything is set up
      setTimeout(() => {
        this.setSenderTrackEnabled(true);
        if (newStream && newStream.active) {
          newStream.getAudioTracks().forEach((track) => {
            if (track.readyState === 'live') {
              track.enabled = true;
            }
          });
        }
      }, 500);
      
      if (backupStream && backupStream.active) {
        backupStream.getAudioTracks().forEach((track) => track.stop());
        backupStream = null;
      }

      return newStream;
    } catch (error) {
      // Device change failed. Clean up the tentative new stream to avoid lingering
      // stuff, then try to rollback to the previous input stream.
      if (newStream && typeof newStream.getAudioTracks === 'function') {
        newStream.getAudioTracks().forEach((t) => t.stop());
        newStream = null;
      }

      // Rollback to backup stream
      if (backupStream && backupStream.active) {
        this.setInputStream(backupStream).catch((rollbackError) => {
          logger.error({
            logCode: 'audio_changeinputdevice_rollback_failure',
            extraInfo: {
              bridgeName: this.bridgeName,
              deviceId,
              errorName: rollbackError.name,
              errorMessage: rollbackError.message,
            },
          }, 'Microphone device change rollback failed - the device may become silent');

          backupStream.getAudioTracks().forEach((track) => track.stop());
          backupStream = null;
        });
      }

      throw error;
    }
  }

  trackTransferState(transferCallback) {
    return new Promise((resolve) => {
      transferCallback();
      resolve();
    });
  }
}
