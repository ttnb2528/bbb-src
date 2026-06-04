import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';
import browserInfo from '/imports/utils/browserInfo';
import deviceInfo from '/imports/utils/deviceInfo';
import Session from '/imports/ui/services/storage/in-memory';
import PollingContainer from '/imports/ui/components/polling/container';
import logger from '/imports/startup/client/logger';
import ActivityCheckContainer from '/imports/ui/components/activity-check/container';
import ToastContainer from '/imports/ui/components/common/toast/container';
import KEY_CODES from '/imports/utils/keyCodes';
import WakeLockContainer from '../wake-lock/container';
import NotificationsBarContainer from '../notifications-bar/container';
import AudioContainer from '../audio/container';
import BannerBarContainer from '/imports/ui/components/banner-bar/container';
import RaiseHandNotifier from '/imports/ui/components/raisehand-notifier/container';
import ManyWebcamsNotifier from '/imports/ui/components/video-provider/many-users-notify/container';
import AudioCaptionsSpeechContainer from '/imports/ui/components/audio/audio-graphql/audio-captions/speech/component';
import UploaderContainer from '/imports/ui/components/presentation/presentation-uploader/container';
import ScreenReaderAlertContainer from '../screenreader-alert/container';
import ScreenReaderAlertAdapter from '../screenreader-alert/adapter';
import WebcamContainer from '../webcam/component';
import PresentationContainer from '../presentation/container';
import ScreenshareContainer from '../screenshare/container';
import ExternalVideoPlayerContainer from '../external-video-player/external-video-player-graphql/component';
import GenericContentMainAreaContainer from '../generic-content/generic-main-content/container';
import EmojiRainContainer from '../emoji-rain/container';
import Styled from './styles';
import LayoutEngine from '../layout/layout-manager/layoutEngine';
import NavBarContainer from '../nav-bar/container';
// Sidebar-navigation đã được gộp vào sidebar-content với tabs - không cần import nữa
// import SidebarNavigationContainer from '../sidebar-navigation/container';
import SidebarContentContainer from '../sidebar-content/container';
import PluginsEngineManager from '../plugins-engine/manager';
import Notifications from '../notifications/component';
import { PANELS, ACTIONS } from '../layout/enums';
import GlobalStyles from '/imports/ui/stylesheets/styled-components/globalStyles';
import ActionsBarContainer from '../actions-bar/container';
import PushLayoutEngine from '../layout/push-layout/pushLayoutEngine';
import NotesContainer from '/imports/ui/components/notes/component';
import MobilePanelButtonsContainer from '../mobile-panel-buttons/container';
import AppService from '/imports/ui/components/app/service';
import PresentationUploaderToastContainer from '/imports/ui/components/presentation/presentation-toast/presentation-uploader-toast/container';
import BreakoutJoinConfirmationContainerGraphQL from '../breakout-join-confirmation/breakout-join-confirmation-graphql/component';
import FloatingWindowContainer from '/imports/ui/components/floating-window/container';
import ChatAlertContainerGraphql from '../chat/chat-graphql/alert/component';
import FloatingChatContainer from '../chat/floating-chat/container';
import { notify } from '/imports/ui/services/notification';
import VoiceActivityAdapter from '../../core/adapters/voice-activity';
import LayoutObserver from '../layout/observer';
import BBBLiveKitRoomContainer from '/imports/ui/components/livekit/component';
import EcommerceLayout from '/imports/ui/components/ecommerce-layout/component';
import OneToOneLayoutModule from '/imports/ui/components/one-to-one-layout/component';

const OneToOneLayout = OneToOneLayoutModule?.default || OneToOneLayoutModule;

const intlMessages = defineMessages({
  userListLabel: {
    id: 'app.userList.label',
    description: 'Aria-label for Userlist Nav',
  },
  chatLabel: {
    id: 'app.chat.label',
    description: 'Aria-label for Chat Section',
  },
  actionsBarLabel: {
    id: 'app.actionsBar.label',
    description: 'Aria-label for ActionsBar Section',
  },
  clearedReaction: {
    id: 'app.toast.clearedReactions.label',
    description: 'message for cleared reactions',
  },
  raisedHand: {
    id: 'app.toast.setEmoji.raiseHand',
    description: 'toast message for raised hand notification',
  },
  loweredHand: {
    id: 'app.toast.setEmoji.lowerHand',
    description: 'toast message for lowered hand notification',
  },
  away: {
    id: 'app.toast.setEmoji.away',
    description: 'toast message for set away notification',
  },
  notAway: {
    id: 'app.toast.setEmoji.notAway',
    description: 'toast message for remove away notification',
  },
  meetingMuteOn: {
    id: 'app.toast.meetingMuteOn.label',
    description: 'message used when meeting has been muted',
  },
  meetingMuteOff: {
    id: 'app.toast.meetingMuteOff.label',
    description: 'message used when meeting has been unmuted',
  },
  pollPublishedLabel: {
    id: 'app.whiteboard.annotations.poll',
    description: 'message displayed when a poll is published',
  },
  defaultViewLabel: {
    id: 'app.title.defaultViewLabel',
    description: 'view name appended to document title',
  },
  promotedLabel: {
    id: 'app.toast.promotedLabel',
    description: 'notification message when promoted',
  },
  demotedLabel: {
    id: 'app.toast.demotedLabel',
    description: 'notification message when demoted',
  },
});

const propTypes = {
  darkTheme: PropTypes.bool.isRequired,
  hideNotificationToasts: PropTypes.bool.isRequired,
  isBreakout: PropTypes.bool.isRequired,
  meetingId: PropTypes.string.isRequired,
  meetingName: PropTypes.string.isRequired,
  metadata: PropTypes.object,
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAudioModalOpen: false,
      isVideoPreviewModalOpen: false,
      presentationFitToWidth: false,
      isJoinLogged: false,
      forceEcommerce: false,
    };

    this.timeOffsetInterval = null;

    this.setPresentationFitToWidth = this.setPresentationFitToWidth.bind(this);
    this.setAudioModalIsOpen = this.setAudioModalIsOpen.bind(this);
    this.setVideoPreviewModalIsOpen = this.setVideoPreviewModalIsOpen.bind(this);
    this.customPollShortcutHandler = this.customPollShortcutHandler.bind(this);
    this.logJoin = this.logJoin.bind(this);
    this.toggleEcommerce = this.toggleEcommerce.bind(this);
    this.resolveOneToOneMode = this.resolveOneToOneMode.bind(this);
    this.applyOneToOneBodyClass = this.applyOneToOneBodyClass.bind(this);
  }

  toggleEcommerce() {
    this.setState((prevState) => ({
      forceEcommerce: !prevState.forceEcommerce,
    }));
  }

  componentDidMount() {
    const { browserName } = browserInfo;
    const { osName } = deviceInfo;
    const { isJoinLogged } = this.state;
    const { isPollingEnabled } = this.props;

    Session.setItem('videoPreviewFirstOpen', true);

    ReactModal.setAppElement('#app');

    const body = document.getElementsByTagName('body')[0];

    if (browserName) {
      body.classList.add(
        `browser-${browserName.split(' ').pop().toLowerCase()}`,
      );
    }

    body.classList.add(`os-${osName.split(' ').shift().toLowerCase()}`);

    window.ondragover = (e) => {
      e.preventDefault();
    };
    window.ondrop = (e) => {
      e.preventDefault();
    };

    if (isPollingEnabled) {
      window.addEventListener('keydown', this.customPollShortcutHandler);
    }

    if (!isJoinLogged) {
      this.logJoin();
    }

    AppService.initializeEmojiData();

    // TIKTOK SWIPE TO HIDE FEATURE
    let touchStartX = 0;
    let touchStartY = 0;
    let ignoreSwipe = false;

    window.addEventListener(
      'touchstart',
      (e) => {
        // Bỏ qua swipe nếu đang thao tác trên các thành phần UI (input, nút bấm, khung chat...)
        const { target } = e;
        if (
          target
          && target.closest(
            'input, textarea, button, [role="button"], .floating-chat, [aria-label], svg, canvas, .tl-container',
          )
        ) {
          ignoreSwipe = true;
          return;
        }
        ignoreSwipe = false;
        if (e.changedTouches && e.changedTouches.length > 0) {
          touchStartX = e.changedTouches[0].screenX;
          touchStartY = e.changedTouches[0].screenY;
        }
      },
      { passive: true },
    );

    window.addEventListener(
      'touchend',
      (e) => {
        if (ignoreSwipe) return;
        if (e.changedTouches && e.changedTouches.length > 0) {
          const touchEndX = e.changedTouches[0].screenX;
          const touchEndY = e.changedTouches[0].screenY;

          const dx = touchEndX - touchStartX;
          const dy = touchEndY - touchStartY;

          // Vuốt ngang và đủ dài (> 50px)
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
            if (dx > 0) {
              // Vuốt PHẢI -> Ẩn UI
              window.dispatchEvent(
                new CustomEvent('swipe-ui', { detail: { hide: true } }),
              );
            } else {
              // Vuốt TRÁI -> Hiện UI
              window.dispatchEvent(
                new CustomEvent('swipe-ui', { detail: { hide: false } }),
              );
            }
          }
        }
      },
      { passive: true },
    );

    this.applyOneToOneBodyClass();
  }

  componentDidUpdate(prevProps) {
    const {
      currentUserAway, currentUserRaiseHand, intl, fitToWidth,
    } = this.props;

    const { isJoinLogged } = this.state;

    this.renderDarkMode();

    if (prevProps.currentUserAway !== currentUserAway) {
      if (currentUserAway === true) {
        notify(intl.formatMessage(intlMessages.away), 'info', 'user');
      } else {
        notify(
          intl.formatMessage(intlMessages.notAway),
          'info',
          'clear_status',
        );
      }
    }

    if (prevProps.currentUserRaiseHand !== currentUserRaiseHand) {
      if (currentUserRaiseHand === true) {
        notify(intl.formatMessage(intlMessages.raisedHand), 'info', 'user');
      } else {
        notify(
          intl.formatMessage(intlMessages.loweredHand),
          'info',
          'clear_status',
        );
      }
    }

    if (prevProps.fitToWidth !== fitToWidth) {
      this.setState({ presentationFitToWidth: fitToWidth });
    }

    if (!isJoinLogged) {
      this.logJoin();
    }

    if (
      prevProps.metadata !== this.props.metadata
      || prevProps.meetingName !== this.props.meetingName
    ) {
      this.applyOneToOneBodyClass();
    }
  }

  componentWillUnmount() {
    const { isPollingEnabled } = this.props;
    window.onbeforeunload = null;

    if (this.timeOffsetInterval) {
      clearInterval(this.timeOffsetInterval);
    }

    if (isPollingEnabled) {
      window.removeEventListener('keydown', this.customPollShortcutHandler);
    }

    if (typeof document !== 'undefined') {
      document.body.classList.remove('bbb-one-to-one-call');
    }
  }

  resolveOneToOneMode(metadata, meetingName = '') {
    const queryParams = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;

    const queryLayout = (queryParams?.get('layout') || '').toLowerCase();
    const queryMode = (queryParams?.get('mode') || '').toLowerCase();
    const metadataRoomType = (metadata?.meta_roomType || metadata?.roomType || '').toLowerCase();
    const normalizedMeetingName = (meetingName || '').toLowerCase().trim();
    const normalizedDocumentTitle = typeof document !== 'undefined'
      ? (document.title || '').toLowerCase().trim()
      : '';
    const normalizedReferrer = typeof document !== 'undefined'
      ? (document.referrer || '').toLowerCase().trim()
      : '';
    const hasStoredOneToOneContext = (() => {
      if (typeof window === 'undefined') return false;
      try {
        const raw = window.localStorage?.getItem('ovfOneToOneCallContext');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        return !!(parsed && typeof parsed === 'object');
      } catch (_err) {
        return false;
      }
    })();
    const looksLikeOneToOneByName = normalizedMeetingName.startsWith('1-1 ')
      || normalizedMeetingName.startsWith('1:1 ')
      || normalizedMeetingName.includes(' one-to-one ')
      || normalizedMeetingName.includes(' 1-1 ');
    const looksLikeOneToOneByTitle = normalizedDocumentTitle.includes(' 1-1 ')
      || normalizedDocumentTitle.includes(' one-to-one ');
    const looksLikeOneToOneByReferrer = normalizedReferrer.includes('mode=1-1')
      || normalizedReferrer.includes('mode=one-to-one')
      || normalizedReferrer.includes('layout=one-to-one')
      || normalizedReferrer.includes('onetoone=true')
      || normalizedReferrer.includes('/call/join/');

    return (
      ['one-to-one', 'one_to_one', '1-1', '1v1', 'one2one'].includes(
        queryLayout,
      )
      || ['one-to-one', 'one_to_one', '1-1', '1v1', 'one2one'].includes(
        queryMode,
      )
      || ['one-to-one', 'one_to_one', '1-1', '1v1', 'one2one'].includes(
        metadataRoomType,
      )
      || looksLikeOneToOneByName
      || looksLikeOneToOneByTitle
      || looksLikeOneToOneByReferrer
      || hasStoredOneToOneContext
      || (typeof window !== 'undefined'
        && window.location.href.includes('oneToOne=true'))
    );
  }

  applyOneToOneBodyClass() {
    if (typeof document === 'undefined') return;

    const isOneToOneMode = this.resolveOneToOneMode(
      this.props.metadata,
      this.props.meetingName,
    );
    document.body.classList.toggle('bbb-one-to-one-call', !!isOneToOneMode);
  }

  setPresentationFitToWidth(presentationFitToWidth) {
    const { handlePresentationFitToWidth } = this.props;
    handlePresentationFitToWidth(presentationFitToWidth);
    this.setState({ presentationFitToWidth });
  }

  setAudioModalIsOpen(value) {
    this.setState({ isAudioModalOpen: value });
  }

  setVideoPreviewModalIsOpen(value) {
    this.setState({ isVideoPreviewModalOpen: value });
  }

  customPollShortcutHandler(e) {
    const {
      altKey, ctrlKey, metaKey, keyCode,
    } = e;
    const { layoutContextDispatch } = this.props;
    const isPollShortcut = altKey && keyCode === KEY_CODES.P && (ctrlKey || metaKey);

    if (isPollShortcut) {
      if (Session.equals('pollInitiated', true)) {
        Session.setItem('resetPollPanel', true);
      }

      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
        value: true,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
        value: PANELS.POLL,
      });

      Session.setItem('forcePollOpen', true);
      Session.setItem('customPollShortcut', true);
    }
  }

  logJoin() {
    const { isJoinLogged } = this.state;
    const { meetingId, meetingName, isBreakout } = this.props;

    const logMessage = isBreakout
      ? 'User joined breakout room'
      : 'User joined main room';

    if (!isJoinLogged && meetingId) {
      logger.info(
        {
          logCode: 'app_component_componentdidmount',
          extraInfo: {
            meetingId,
            meetingName,
          },
        },
        logMessage,
      );
      this.setState({ isJoinLogged: true });
    }
  }

  renderDarkMode() {
    const { darkTheme } = this.props;

    AppService.setDarkTheme(darkTheme);
  }

  renderActionsBar() {
    const { hideActionsBar, presentationIsOpen } = this.props;

    if (hideActionsBar) return null;

    return (
      <ActionsBarContainer
        presentationIsOpen={presentationIsOpen}
        setPresentationFitToWidth={this.setPresentationFitToWidth}
      />
    );
  }

  renderAudioCaptions() {
    const { audioCaptions, captionsStyle } = this.props;

    if (!audioCaptions) return null;

    return (
      <Styled.CaptionsWrapper
        role="region"
        style={{
          position: 'absolute',
          left: captionsStyle.left,
          right: captionsStyle.right,
          maxWidth: captionsStyle.maxWidth,
        }}
      >
        {audioCaptions}
      </Styled.CaptionsWrapper>
    );
  }

  render() {
    const {
      shouldShowExternalVideo,
      shouldShowPresentation,
      shouldShowScreenshare,
      isSharedNotesPinned,
      presentationIsOpen,
      darkTheme,
      intl,
      pluginConfig,
      genericMainContentId,
      hideNotificationToasts,
      isNotificationEnabled,
      isNonMediaLayout,
      isRaiseHandEnabled,
      metadata,
    } = this.props;

    const {
      isAudioModalOpen,
      isVideoPreviewModalOpen,
      presentationFitToWidth,
      forceEcommerce,
    } = this.state;

    console.log(
      'OVBAY METADATA CHECK: ',
      metadata,
      ' NAME: ',
      this.props.meetingName,
    );

    const isOneToOneMode = this.resolveOneToOneMode(
      metadata,
      this.props.meetingName,
    );
    const hasValidOneToOneLayout = typeof OneToOneLayout === 'function';
    const canRenderOneToOne = isOneToOneMode && hasValidOneToOneLayout;

    const isEcommerceMode = !isOneToOneMode
      && (forceEcommerce
        || (this.props.meetingName
          && this.props.meetingName.includes('[OVBAY]'))
        || (metadata
          && (metadata.meta_roomType === 'ecommerce'
            || metadata.roomType === 'ecommerce'))
        || (typeof window !== 'undefined'
          && window.location.href.includes('ecommerce=true')));

    if (typeof window !== 'undefined') {
      window.isEcommerceLive = isEcommerceMode;
      window.isOneToOneCall = isOneToOneMode;
      try {
        if (isOneToOneMode) {
          window.sessionStorage.setItem('ovf_bbb_one_to_one', '1');
        } else {
          window.sessionStorage.removeItem('ovf_bbb_one_to_one');
        }
      } catch (_err) {
        // ignore storage issues
      }
    }

    return (
      <>
        <ScreenReaderAlertAdapter />
        <PluginsEngineManager pluginConfig={pluginConfig} />
        <FloatingWindowContainer />
        <Notifications />
        <PushLayoutEngine
          shouldShowScreenshare={shouldShowScreenshare}
          shouldShowExternalVideo={shouldShowExternalVideo}
        />
        <LayoutEngine />
        <LayoutObserver />
        <GlobalStyles />

        {isEcommerceMode ? (
          <EcommerceLayout
            {...this.props}
            isAudioModalOpen={isAudioModalOpen}
            setAudioModalIsOpen={this.setAudioModalIsOpen}
            isVideoPreviewModalOpen={isVideoPreviewModalOpen}
            setVideoPreviewModalIsOpen={this.setVideoPreviewModalIsOpen}
            presentationFitToWidth={presentationFitToWidth}
            setPresentationFitToWidth={this.setPresentationFitToWidth}
          />
        ) : canRenderOneToOne ? (
          <OneToOneLayout
            {...this.props}
            isAudioModalOpen={isAudioModalOpen}
            setAudioModalIsOpen={this.setAudioModalIsOpen}
            isVideoPreviewModalOpen={isVideoPreviewModalOpen}
            setVideoPreviewModalIsOpen={this.setVideoPreviewModalIsOpen}
            presentationIsOpen={presentationIsOpen}
            setPresentationFitToWidth={this.setPresentationFitToWidth}
            audioCaptionsNode={this.renderAudioCaptions()}
          />
        ) : (
          <Styled.Layout
            id="layout"
            style={{
              width: '100%',
              height: '100%',
            }}
          >
            <ActivityCheckContainer />
            <ScreenReaderAlertContainer />
            <BannerBarContainer />
            <NotificationsBarContainer />
            {/* Sidebar-navigation đã được gộp vào sidebar-content - không render nữa */}
            <SidebarContentContainer
              isSharedNotesPinned={isSharedNotesPinned}
            />
            <NavBarContainer main="new" />
            <WebcamContainer />
            {!isNonMediaLayout && <ExternalVideoPlayerContainer />}
            <GenericContentMainAreaContainer
              genericMainContentId={genericMainContentId}
            />
            {shouldShowPresentation ? (
              <PresentationContainer
                setPresentationFitToWidth={this.setPresentationFitToWidth}
                fitToWidth={presentationFitToWidth}
                darkTheme={darkTheme}
                presentationIsOpen={presentationIsOpen}
              />
            ) : null}
            {!isNonMediaLayout && (
              <ScreenshareContainer
                shouldShowScreenshare={shouldShowScreenshare}
              />
            )}

            {isSharedNotesPinned ? <NotesContainer area="media" /> : null}
            <AudioCaptionsSpeechContainer />
            {this.renderAudioCaptions()}
            {!hideNotificationToasts && isNotificationEnabled && (
              <PresentationUploaderToastContainer intl={intl} />
            )}
            <UploaderContainer />
            <BreakoutJoinConfirmationContainerGraphQL />
            <BBBLiveKitRoomContainer />
            <FloatingChatContainer />
            <AudioContainer
              {...{
                isAudioModalOpen,
                setAudioModalIsOpen: this.setAudioModalIsOpen,
                isVideoPreviewModalOpen,
                setVideoPreviewModalIsOpen: this.setVideoPreviewModalIsOpen,
              }}
            />
            {!hideNotificationToasts && isNotificationEnabled && (
              <ToastContainer rtl />
            )}
            <ChatAlertContainerGraphql />
            {isRaiseHandEnabled && <RaiseHandNotifier />}
            <ManyWebcamsNotifier />
            <PollingContainer />
            <WakeLockContainer />
            {this.renderActionsBar()}
            <MobilePanelButtonsContainer />
            <EmojiRainContainer />
            <VoiceActivityAdapter />
          </Styled.Layout>
        )}
      </>
    );
  }
}

App.propTypes = propTypes;

export default injectIntl(App);
