import logger from '/imports/startup/client/logger';
import { fetchWebRTCMappedStunTurnServers, getMappedFallbackStun } from '/imports/utils/fetchStunTurnServers';
import loadAndPlayMediaStream from '/imports/ui/services/bbb-webrtc-sfu/load-play';
import { SCREENSHARING_ERRORS } from './errors';
import { getVoiceConf } from '/imports/ui/services/meeting-settings';

const HAS_DISPLAY_MEDIA = (typeof navigator.getDisplayMedia === 'function'
  || (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function'));

const getConferenceBridge = () => getVoiceConf();

const normalizeGetDisplayMediaError = (error) => {
  return SCREENSHARING_ERRORS[error.name] || SCREENSHARING_ERRORS.GetDisplayMediaGenericError;
};

const getBoundGDM = () => {
  if (typeof navigator.getDisplayMedia === 'function') {
    return navigator.getDisplayMedia.bind(navigator);
  } else if (navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function') {
    return navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
  }
}

const getScreenStream = async () => {
  const {
    constraints: GDM_CONSTRAINTS,
  } = window.meetingClientSettings.public.kurento.screenshare;

  const gDMCallback = (stream) => {
    // Some older Chromium variants choke on gDM when audio: true by NOT generating
    // a promise rejection AND not generating a valid input screen stream, need to
    // work around that manually for now - prlanzarin
    if (stream == null) {
      return Promise.reject(SCREENSHARING_ERRORS.NotSupportedError);
    }

    // Kiểm tra xem stream có video tracks không
    const videoTracks = stream.getVideoTracks();
    if (videoTracks && videoTracks.length > 0) {
      // Kiểm tra displaySurface để biết là tab, window hay screen
      const videoTrack = videoTracks[0];
      const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
      const displaySurface = settings.displaySurface || (videoTrack.getSettings ? videoTrack.getSettings().displaySurface : null);

      // Tab sharing không được hỗ trợ do vấn đề WebRTC negotiation
      // Reject ngay và hướng dẫn user share window thay vì tab
      if (displaySurface === 'browser') {
        // Stop tất cả tracks để cleanup
        stream.getTracks().forEach(track => track.stop());
        
        // Reject với error code mới cho tab sharing
        const customError = new Error('Tab sharing is not supported. Please select "Share window" or "Share entire screen" instead.');
        // Set errorCode là "1139" (string) để match với format của SCREENSHARING_ERRORS
        customError.errorCode = SCREENSHARING_ERRORS.TAB_SHARING_NOT_SUPPORTED?.errorCode || '1139';
        customError.errorMessage = 'Tab sharing is not supported. Please select "Share window" or "Share entire screen" instead.';
        customError.message = customError.errorMessage;
        return Promise.reject(customError);
      }

      // Apply constraints cho video tracks
      if (typeof GDM_CONSTRAINTS.video === 'object') {
        videoTracks.forEach(track => {
          if (typeof track.applyConstraints === 'function') {
            track.applyConstraints(GDM_CONSTRAINTS.video).catch(error => {
              logger.warn({
                logCode: 'screenshare_videoconstraint_failed',
                extraInfo: { errorName: error.name, errorCode: error.code },
              },
                'Error applying screenshare video constraint');
            });
          }
        });
      }
    }

    if (typeof stream.getAudioTracks === 'function'
      && typeof GDM_CONSTRAINTS.audio === 'object') {
      stream.getAudioTracks().forEach(track => {
        if (typeof track.applyConstraints === 'function' && track.readyState === 'live') {
          track.applyConstraints(GDM_CONSTRAINTS.audio).catch(error => {
            logger.warn({
              logCode: 'screenshare_audioconstraint_failed',
              extraInfo: { errorName: error.name, errorCode: error.code },
            }, 'Error applying screenshare audio constraint');
          });
        }
      });
    }

    return Promise.resolve(stream);
  };

  const getDisplayMedia = getBoundGDM();

  if (typeof getDisplayMedia === 'function') {
    return getDisplayMedia(GDM_CONSTRAINTS)
      .then(gDMCallback)
      .catch(error => {
        // Nếu error đã có errorCode (như TAB_SHARING_NOT_SUPPORTED), giữ nguyên
        if (error.errorCode && error.errorMessage) {
          logger.error({
            logCode: 'screenshare_getdisplaymedia_failed',
            extraInfo: { errorCode: error.errorCode, errorMessage: error.errorMessage },
          }, 'getDisplayMedia call failed');
          return Promise.reject(error);
        }
        // Nếu không có errorCode, normalize như bình thường
        const normalizedError = normalizeGetDisplayMediaError(error);
        logger.error({
          logCode: 'screenshare_getdisplaymedia_failed',
          extraInfo: { errorCode: normalizedError.errorCode, errorMessage: normalizedError.errorMessage },
        }, 'getDisplayMedia call failed');
        return Promise.reject(normalizedError);
      });
  } else {
    // getDisplayMedia isn't supported, error its way out
    return Promise.reject(SCREENSHARING_ERRORS.NotSupportedError);
  }
};

const getIceServers = (sessionToken) => {
  return fetchWebRTCMappedStunTurnServers(sessionToken).catch(error => {
    logger.error({
      logCode: 'screenshare_fetchstunturninfo_error',
      extraInfo: { error }
    }, 'Screenshare bridge failed to fetch STUN/TURN info');
    return getMappedFallbackStun();
  });
}

const getMediaServerAdapter = () => {
  const {
    mediaServer,
  } = window.meetingClientSettings.public.kurento.screenshare;
  return mediaServer;
};

const getNextReconnectionInterval = (oldInterval) => {
  const {
    mediaTimeouts: MEDIA_TIMEOUTS,
  } = window.meetingClientSettings.public.kurento.screenshare;
  const {
    maxTimeout: MAX_MEDIA_TIMEOUT,
    timeoutIncreaseFactor: TIMEOUT_INCREASE_FACTOR,
    baseReconnectionTimeout: BASE_RECONNECTION_TIMEOUT,
  } = MEDIA_TIMEOUTS;
  return Math.min(
    (TIMEOUT_INCREASE_FACTOR * Math.max(oldInterval, BASE_RECONNECTION_TIMEOUT)),
    MAX_MEDIA_TIMEOUT,
  );
}

const streamHasAudioTrack = (stream) => {
  return stream
    && typeof stream.getAudioTracks === 'function'
    && stream.getAudioTracks().length >= 1;
}

const dispatchAutoplayHandlingEvent = (mediaElement) => {
  const tagFailedEvent = new CustomEvent('screensharePlayFailed',
    { detail: { mediaElement } });
  window.dispatchEvent(tagFailedEvent);
}

const screenshareLoadAndPlayMediaStream = (stream, mediaElement, muted) => {
  return loadAndPlayMediaStream(stream, mediaElement, muted).catch(error => {
    // NotAllowedError equals autoplay issues, fire autoplay handling event.
    // This will be handled in the screenshare react component.
    if (error.name === 'NotAllowedError') {
      logger.error({
        logCode: 'screenshare_error_autoplay',
        extraInfo: { errorName: error.name },
      }, 'Screen share media play failed: autoplay error');
      dispatchAutoplayHandlingEvent(mediaElement);
    } else {
      throw {
        errorCode: SCREENSHARING_ERRORS.SCREENSHARE_PLAY_FAILED.errorCode,
        errorMessage: error.message || SCREENSHARING_ERRORS.SCREENSHARE_PLAY_FAILED.errorMessage,
      };
    }
  });
}

class EXPORTED_CONFIGS {
  static BASE_MEDIA_TIMEOUT() {
    const {
      mediaTimeouts: MEDIA_TIMEOUTS,
    } = window.meetingClientSettings.public.kurento.screenshare;
    const {
      baseTimeout: BASE_MEDIA_TIMEOUT,
    } = MEDIA_TIMEOUTS;
    return BASE_MEDIA_TIMEOUT;
  }

  static BASE_RECONNECTION_TIMEOUT() {
    const {
      mediaTimeouts: MEDIA_TIMEOUTS,
    } = window.meetingClientSettings.public.kurento.screenshare;
    const {
      baseReconnectionTimeout: BASE_RECONNECTION_TIMEOUT,
    } = MEDIA_TIMEOUTS;
    return BASE_RECONNECTION_TIMEOUT;
  }

  static MAX_CONN_ATTEMPTS() {
    const {
      mediaTimeouts: MEDIA_TIMEOUTS,
    } = window.meetingClientSettings.public.kurento.screenshare;
    const {
      maxConnectionAttempts: MAX_CONN_ATTEMPTS,
    } = MEDIA_TIMEOUTS;
    return MAX_CONN_ATTEMPTS;
  }

  static BASE_BITRATE() {
    const {
      bitrate: BASE_BITRATE,
    } = window.meetingClientSettings.public.kurento.screenshare;
    return BASE_BITRATE;
  }
}

export default {
  HAS_DISPLAY_MEDIA,
  getConferenceBridge,
  getScreenStream,
  getIceServers,
  getNextReconnectionInterval,
  streamHasAudioTrack,
  screenshareLoadAndPlayMediaStream,
  getMediaServerAdapter,
  BASE_MEDIA_TIMEOUT: EXPORTED_CONFIGS.BASE_MEDIA_TIMEOUT,
  BASE_RECONNECTION_TIMEOUT: EXPORTED_CONFIGS.BASE_RECONNECTION_TIMEOUT,
  MAX_CONN_ATTEMPTS: EXPORTED_CONFIGS.MAX_CONN_ATTEMPTS,
  BASE_BITRATE: EXPORTED_CONFIGS.BASE_BITRATE,
};
