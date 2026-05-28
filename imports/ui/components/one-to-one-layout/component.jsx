import React from 'react';
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
