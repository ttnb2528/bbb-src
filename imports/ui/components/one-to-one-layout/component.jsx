import React, { useEffect, useMemo, useState } from 'react';
import Styled from '../app/styles';
import ActivityCheckContainer from '/imports/ui/components/activity-check/container';
import ScreenReaderAlertContainer from '/imports/ui/components/screenreader-alert/container';
import WebcamContainer from '/imports/ui/components/webcam/component';
import AudioCaptionsSpeechContainer from '/imports/ui/components/audio/audio-graphql/audio-captions/speech/component';
import BBBLiveKitRoomContainer from '/imports/ui/components/livekit/component';
import AudioContainer from '/imports/ui/components/audio/container';
import WakeLockContainer from '/imports/ui/components/wake-lock/container';
import ActionsBarContainer from '/imports/ui/components/actions-bar/container';
import VoiceActivityAdapter from '/imports/ui/core/adapters/voice-activity';
import FloatingChatContainer from '/imports/ui/components/chat/floating-chat/container';
import useCurrentUser from '/imports/ui/core/hooks/useCurrentUser';
import useUsersBasicInfo from '/imports/ui/core/hooks/useUsersBasicInfo';
import Auth from '/imports/ui/services/auth';

const OneToOneLayout = (props) => {
  const {
    hideActionsBar,
    presentationIsOpen,
    setPresentationFitToWidth,
    isAudioModalOpen,
    setAudioModalIsOpen,
    isVideoPreviewModalOpen,
    setVideoPreviewModalIsOpen,
    audioCaptionsNode,
  } = props;

  const AppStyled = Styled?.default || Styled;
  const Layout = AppStyled?.Layout || 'div';
  const ActivityCheck = ActivityCheckContainer?.default || ActivityCheckContainer;
  const ScreenReaderAlert = ScreenReaderAlertContainer?.default || ScreenReaderAlertContainer;
  const Webcam = WebcamContainer?.default || WebcamContainer;
  const AudioCaptionsSpeech = AudioCaptionsSpeechContainer?.default || AudioCaptionsSpeechContainer;
  const LiveKitRoom = BBBLiveKitRoomContainer?.default || BBBLiveKitRoomContainer;
  const Audio = AudioContainer?.default || AudioContainer;
  const FloatingChat = FloatingChatContainer?.default || FloatingChatContainer;
  const WakeLock = WakeLockContainer?.default || WakeLockContainer;
  const ActionsBar = ActionsBarContainer?.default || ActionsBarContainer;
  const VoiceActivity = VoiceActivityAdapter?.default || VoiceActivityAdapter;
  const { data: currentUser } = useCurrentUser((u) => ({ userId: u.userId }));
  const { data: usersBasicInfo } = useUsersBasicInfo((u) => ({ userId: u.userId }));
  const [timedOut, setTimedOut] = useState(false);
  const [remainingWaitSec, setRemainingWaitSec] = useState(null);

  const callMeta = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        role: '',
        expiresAtMs: null,
        callerId: '',
        calleeId: '',
        selfUserId: '',
      };
    }
    const params = new URLSearchParams(window.location.search);
    const roleFromQuery = (params.get('callRole') || params.get('call_role') || '').toLowerCase();
    const callerId = String(params.get('callerId') || params.get('caller_id') || '').trim();
    const calleeId = String(params.get('calleeId') || params.get('callee_id') || '').trim();
    const selfUserId = String(
      params.get('selfUserId')
      || params.get('self_user_id')
      || currentUser?.userId
      || '',
    ).trim();
    const rawExpiresAt = params.get('callExpiresAt') || params.get('call_expires_at') || '';
    const parsedExpiresAt = rawExpiresAt ? Date.parse(rawExpiresAt) : Number.NaN;
    let role = roleFromQuery;
    if (!role) {
      if (selfUserId && callerId && selfUserId === callerId) {
        role = 'caller';
      } else if (selfUserId && calleeId && selfUserId === calleeId) {
        role = 'callee';
      }
    }
    return {
      role,
      expiresAtMs: Number.isFinite(parsedExpiresAt) ? parsedExpiresAt : null,
      callerId,
      calleeId,
      selfUserId,
    };
  }, [currentUser?.userId]);

  const remoteAvatar = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get('peerAvatar')
        || params.get('remoteAvatar')
        || params.get('guestAvatar')
        || params.get('otherAvatar')
        || params.get('participantAvatar')
        || '';
      if (fromQuery) return decodeURIComponent(fromQuery);
    } catch {
      // ignore
    }

    try {
      const raw = window.localStorage?.getItem('ovfOneToOneCallContext');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      const fromStorage = parsed?.peerAvatar || parsed?.remoteAvatar || '';
      if (!fromStorage) return '';
      try {
        return decodeURIComponent(fromStorage);
      } catch {
        return fromStorage;
      }
    } catch {
      return '';
    }
  }, []);

  const expectedRemoteUserId = useMemo(() => {
    const { selfUserId, callerId, calleeId } = callMeta;
    if (selfUserId && callerId && calleeId) {
      return selfUserId === callerId ? calleeId : callerId;
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage?.getItem('ovfOneToOneCallContext');
        if (raw) {
          const parsed = JSON.parse(raw);
          const local = String(parsed?.selfUserId || parsed?.localUserId || '').trim();
          const c1 = String(parsed?.callerId || '').trim();
          const c2 = String(parsed?.calleeId || '').trim();
          if (local && c1 && c2) {
            return local === c1 ? c2 : c1;
          }
        }
      } catch {
        // ignore invalid local context
      }
    }

    return '';
  }, [callMeta]);

  const hasRemoteParticipant = useMemo(() => {
    const me = String(currentUser?.userId || '');
    if (!Array.isArray(usersBasicInfo) || !me) return false;
    if (expectedRemoteUserId) {
      return usersBasicInfo.some(
        (u) => String(u?.userId || '').trim() === expectedRemoteUserId,
      );
    }
    return usersBasicInfo.some((u) => String(u?.userId || '') !== me);
  }, [usersBasicInfo, currentUser?.userId, expectedRemoteUserId]);

  const shouldWaitForPeer = useMemo(() => {
    if (timedOut) return false;
    // If callRole is missing from BBB URL, we still want "first entrant waits".
    const unknownRole = !callMeta.role;
    const isCaller = callMeta.role === 'caller';
    return (isCaller || unknownRole) && !hasRemoteParticipant;
  }, [timedOut, callMeta.role, hasRemoteParticipant]);

  useEffect(() => {
    if (timedOut) return undefined;
    if (!shouldWaitForPeer) return undefined;
    if (!callMeta.expiresAtMs) return undefined;

    let leaveTimer = null;
    const tick = () => {
      const now = Date.now();
      if (now < callMeta.expiresAtMs) return;
      setTimedOut(true);
      leaveTimer = setTimeout(() => {
        const logoutURL = Auth.logoutURL || '/';
        if (window.opener && !window.opener.closed) {
          window.close();
          return;
        }
        window.location.href = logoutURL;
      }, 1800);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => {
      clearInterval(intervalId);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [timedOut, shouldWaitForPeer, callMeta.expiresAtMs]);

  useEffect(() => {
    if (!shouldWaitForPeer || timedOut || !callMeta.expiresAtMs) {
      setRemainingWaitSec(null);
      return undefined;
    }

    const tick = () => {
      const sec = Math.max(0, Math.ceil((callMeta.expiresAtMs - Date.now()) / 1000));
      setRemainingWaitSec(sec);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [shouldWaitForPeer, callMeta.expiresAtMs, timedOut]);

  return (
    <Layout
      id="layout"
      className="one-to-one-layout"
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
      }}
    >
      <style>
        {`
          body.bbb-one-to-one-call {
            background: #010712 !important;
          }

          body.bbb-one-to-one-call #layout.one-to-one-layout {
            isolation: isolate;
          }

          body.bbb-one-to-one-call .Toastify__toast-container,
          body.bbb-one-to-one-call [data-test="toastContainer"] {
            display: none !important;
          }

          body.bbb-one-to-one-call .one-to-one-layout .oto-backdrop {
            position: fixed;
            inset: 0;
            z-index: 0;
            background:
              radial-gradient(circle at 10% 12%, rgba(56, 189, 248, 0.14), transparent 38%),
              radial-gradient(circle at 86% 8%, rgba(129, 140, 248, 0.13), transparent 42%),
              linear-gradient(180deg, #04152a 0%, #031022 62%, #020c19 100%);
            pointer-events: none;
          }

          /* Hide meeting UX that does not belong to 1-1 calling */
          body.bbb-one-to-one-call #ActionsBar [data-test="roomName"],
          body.bbb-one-to-one-call #ActionsBar [data-test="toggleUserList"],
          body.bbb-one-to-one-call #ActionsBar [data-test="togglePrivateChats"],
          body.bbb-one-to-one-call #ActionsBar [data-test="reactionsButton"],
          body.bbb-one-to-one-call #ActionsBar [data-test="removeReactionButton"],
          body.bbb-one-to-one-call #ActionsBar [data-test="raiseHandBtn"],
          body.bbb-one-to-one-call #ActionsBar [data-test="lowerHandBtn"],
          body.bbb-one-to-one-call #ActionsBar [data-test="optionsButton"],
          body.bbb-one-to-one-call #ActionsBar [data-test="actionsButton"],
          body.bbb-one-to-one-call #ActionsBar [data-test="quickPollBtn"],
          body.bbb-one-to-one-call #ActionsBar [data-test="yesNoQuickPoll"],
          body.bbb-one-to-one-call #ActionsBar [data-test="moreMenuButton"],
          body.bbb-one-to-one-call #ActionsBar [data-test="liveIndicator"],
          body.bbb-one-to-one-call #ActionsBar [data-test="togglePrivateChatSize"],
          body.bbb-one-to-one-call #ActionsBar [data-test="closePrivateChatModal"] {
            display: none !important;
          }

          body.bbb-one-to-one-call #ActionsBar > div > div:first-child,
          body.bbb-one-to-one-call #ActionsBar div[class*="PrivateChatNotificationPanel"],
          body.bbb-one-to-one-call #ActionsBar div[class*="PrivateChatDock"],
          body.bbb-one-to-one-call #ActionsBar [class*="Time"] {
            display: none !important;
          }

          body.bbb-one-to-one-call #ActionsBar > div {
            justify-content: center !important;
            gap: 10px !important;
          }

          body.bbb-one-to-one-call #ActionsBar button[data-test="audioDropdownMenu"],
          body.bbb-one-to-one-call #ActionsBar button[data-test="videoDropdownMenu"] {
            display: none !important;
          }

          body.bbb-one-to-one-call #ActionsBar span:has(> button[data-test="audioDropdownMenu"]),
          body.bbb-one-to-one-call #ActionsBar span:has(> button[data-test="videoDropdownMenu"]),
          body.bbb-one-to-one-call #ActionsBar span:has(> div > button[data-test="audioDropdownMenu"]),
          body.bbb-one-to-one-call #ActionsBar span:has(> div > button[data-test="videoDropdownMenu"]) {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
        `}
      </style>
      <div className="oto-backdrop" />
      {!timedOut && shouldWaitForPeer && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 86,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            background: 'rgba(0, 0, 0, 0.58)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              width: 'min(92vw, 360px)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(11, 20, 38, 0.78)',
              boxShadow: '0 16px 50px rgba(0,0,0,0.35)',
              padding: '18px 16px',
              textAlign: 'center',
              color: '#fff',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                margin: '0 auto 12px',
                borderRadius: '50%',
                border: '2px solid rgba(121, 127, 255, 0.85)',
                boxShadow: '0 0 0 6px rgba(121,127,255,0.14)',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              {remoteAvatar ? (
                <img
                  src={remoteAvatar}
                  alt="Peer avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 30,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.86)',
                  }}
                >
                  ?
                </div>
              )}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
              Calling...
            </div>
            <div style={{ fontSize: 14, opacity: 0.92 }}>
              Waiting for the other person to accept the call.
            </div>
            {typeof remainingWaitSec === 'number' ? (
              <div style={{ fontSize: 12, marginTop: 10, opacity: 0.78 }}>
                {`Auto end after ${remainingWaitSec}s`}
              </div>
            ) : null}
          </div>
        </div>
      )}
      {timedOut && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.56)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              width: 'min(92vw, 360px)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(11, 20, 38, 0.9)',
              boxShadow: '0 16px 50px rgba(0,0,0,0.35)',
              padding: '18px 16px',
              textAlign: 'center',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              KhÃƒÂ´ng cÃƒÂ³ phÃ¡ÂºÂ£n hÃ¡Â»â€œi
            </div>
            <div style={{ fontSize: 14, opacity: 0.92 }}>
              NgÃ†Â°Ã¡Â»Âi nhÃ¡ÂºÂ­n khÃƒÂ´ng trÃ¡ÂºÂ£ lÃ¡Â»Âi cuÃ¡Â»â„¢c gÃ¡Â»Âi.
            </div>
          </div>
        </div>
      )}
      {shouldWaitForPeer ? (
        <>
          <Audio
            {...{
              isAudioModalOpen,
              setAudioModalIsOpen,
              isVideoPreviewModalOpen,
              setVideoPreviewModalIsOpen,
            }}
          />
          {!hideActionsBar && (
            <ActionsBar
              presentationIsOpen={presentationIsOpen}
              setPresentationFitToWidth={setPresentationFitToWidth}
            />
          )}
        </>
      ) : (
        <>
          <ActivityCheck />
          <ScreenReaderAlert />
          <Webcam />
          <AudioCaptionsSpeech />
          {audioCaptionsNode}
          <LiveKitRoom />
          <Audio
            {...{
              isAudioModalOpen,
              setAudioModalIsOpen,
              isVideoPreviewModalOpen,
              setVideoPreviewModalIsOpen,
            }}
          />
          <FloatingChat />
          <WakeLock />
          {!hideActionsBar && (
            <ActionsBar
              presentationIsOpen={presentationIsOpen}
              setPresentationFitToWidth={setPresentationFitToWidth}
            />
          )}
          <VoiceActivity />
        </>
      )}
    </Layout>
  );
};

export default OneToOneLayout;
