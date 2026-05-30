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

  const callMeta = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        role: '',
        expiresAtMs: null,
      };
    }
    const params = new URLSearchParams(window.location.search);
    const role = (params.get('callRole') || params.get('call_role') || '').toLowerCase();
    const rawExpiresAt = params.get('callExpiresAt') || params.get('call_expires_at') || '';
    const parsedExpiresAt = rawExpiresAt ? Date.parse(rawExpiresAt) : Number.NaN;
    return {
      role,
      expiresAtMs: Number.isFinite(parsedExpiresAt) ? parsedExpiresAt : null,
    };
  }, []);

  const hasRemoteParticipant = useMemo(() => {
    const me = String(currentUser?.userId || '');
    if (!Array.isArray(usersBasicInfo) || !me) return false;
    return usersBasicInfo.some((u) => String(u?.userId || '') !== me);
  }, [usersBasicInfo, currentUser?.userId]);

  useEffect(() => {
    if (timedOut) return undefined;
    if (callMeta.role !== 'caller') return undefined;
    if (!callMeta.expiresAtMs) return undefined;
    if (hasRemoteParticipant) return undefined;

    const tick = () => {
      const now = Date.now();
      if (now < callMeta.expiresAtMs) return;
      setTimedOut(true);
      const leaveTimer = setTimeout(() => {
        const logoutURL = Auth.logoutURL || '/';
        if (window.opener && !window.opener.closed) {
          window.close();
          return;
        }
        window.location.href = logoutURL;
      }, 1800);
      return () => clearTimeout(leaveTimer);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [timedOut, callMeta.role, callMeta.expiresAtMs, hasRemoteParticipant]);

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
              Không có phản hồi
            </div>
            <div style={{ fontSize: 14, opacity: 0.92 }}>
              Người nhận không trả lời cuộc gọi.
            </div>
          </div>
        </div>
      )}
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
    </Layout>
  );
};

export default OneToOneLayout;
