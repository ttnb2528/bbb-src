import React, { PureComponent } from 'react';
import { defineMessages } from 'react-intl';
import { ActionsBarItemType, ActionsBarPosition } from 'bigbluebutton-html-plugin-sdk/dist/cjs/extensible-areas/actions-bar-item/enums';
import Styled from './styles';
import getFromUserSettings from '/imports/ui/services/users-settings';
import ActionsDropdown from './actions-dropdown/container';
import AudioCaptionsButtonContainer from '/imports/ui/components/audio/audio-graphql/audio-captions/button/component';
import ScreenshareButtonContainer from '/imports/ui/components/actions-bar/screenshare/container';
import AudioControlsContainer from '../audio/audio-graphql/audio-controls/component';
import JoinVideoOptionsContainer from '../video-provider/video-button/container';
import PresentationOptionsContainer from './presentation-options/component';
import SwapPresentationButton from './swap-presentation/component';
import Button from '/imports/ui/components/common/button/component';
import { getSettingsSingletonInstance } from '/imports/ui/services/settings';
import { LAYOUT_TYPE, PANELS, ACTIONS } from '../layout/enums';
import { layoutDispatch } from '../layout/context';
import ReactionsButtonContainer from '/imports/ui/components/actions-bar/reactions-button/container';
import RaiseHandButtonContainer from '/imports/ui/components/actions-bar/raise-hand-button/container';
import Selector from '/imports/ui/components/common/selector/component';
import ToggleGroup from '/imports/ui/components/common/toggle-group/component';
import Separator from '/imports/ui/components/common/separator/component';
import RecordingIndicatorContainer from '../nav-bar/nav-bar-graphql/recording-indicator/component';
import LiveIndicator from './live-indicator/component';
import LeaveMeetingButtonContainer from '../nav-bar/leave-meeting-button/container';
import OptionsDropdownContainer from '../nav-bar/options-dropdown/container';
import ConnectionStatusButtonContainer from '../connection-status/button/container';
import ConnectionStatusService from '../connection-status/service';
import Icon from '/imports/ui/components/common/icon/icon-ts/component';
import Tooltip from '/imports/ui/components/common/tooltip/component';
import SessionDetailsModal from '/imports/ui/components/session-details/component';
import PrivateChatModal from './private-chat-modal/component';
import PrivateChatNotificationPanel from './private-chat-notification-panel/component';
import deviceInfo from '/imports/utils/deviceInfo';
import MoreMenu from './more-menu/component';

const intlMessages = defineMessages({
  actionsBarLabel: {
    id: 'app.actionsBar.label',
    description: 'Aria-label for ActionsBar Section',
  },
});

class ActionsBar extends PureComponent {
  constructor(props) {
    super(props);

    this.actionsBarRef = React.createRef();
    this.renderPluginsActionBarItems = this.renderPluginsActionBarItems.bind(this);
    this.setModalIsOpen = this.setModalIsOpen.bind(this);
    this.handleTogglePrivateChat = this.handleTogglePrivateChat.bind(this);
    this.handleExternalOpenPrivateChat = this.handleExternalOpenPrivateChat.bind(this);
    this.handleCloseNotificationPanel = this.handleCloseNotificationPanel.bind(this);
    this.handleSelectChatFromPanel = this.handleSelectChatFromPanel.bind(this);
    this.getCurrentTime = this.getCurrentTime.bind(this);

    this.state = {
      isModalOpen: false,
      isPrivateChatModalOpen: false,
      isPrivateChatNotificationPanelOpen: false,
      privateChatButtonRef: null,
      currentTime: this.getCurrentTime(),
    };
  }

  componentDidMount() {
    window.addEventListener('openPrivateChatModal', this.handleExternalOpenPrivateChat);
    // Update time every minute
    this.timeInterval = setInterval(() => {
      this.setState({ currentTime: this.getCurrentTime() });
    }, 60000);
  }

  componentWillUnmount() {
    window.removeEventListener('openPrivateChatModal', this.handleExternalOpenPrivateChat);
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  getCurrentTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  setModalIsOpen(isOpen) {
    this.setState({ isModalOpen: isOpen });
  }

  handleTogglePrivateChat(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    const buttonElement = e?.currentTarget || e?.target?.closest('button');
    
    this.setState((prevState) => {
      // Nếu modal đã mở, dispatch event để expand nếu đang minimized
      if (prevState.isPrivateChatModalOpen) {
        window.dispatchEvent(new CustomEvent('togglePrivateChatModal'));
        return prevState;
      }
      
      // Toggle notification panel: nếu đang mở thì đóng, nếu đang đóng thì mở
      const newPanelState = !prevState.isPrivateChatNotificationPanelOpen;
      
      return {
        isPrivateChatNotificationPanelOpen: newPanelState,
        privateChatButtonRef: newPanelState ? buttonElement : null,
      };
    });
  }
  
  handleCloseNotificationPanel = () => {
    this.setState({ isPrivateChatNotificationPanelOpen: false });
  }
  
  handleSelectChatFromPanel = (chatId) => {
    // Dispatch event với chatId để PrivateChatModal mở đúng chat
    window.dispatchEvent(new CustomEvent('openPrivateChatModal', {
      detail: { chatId },
    }));
    this.setState({
      isPrivateChatNotificationPanelOpen: false,
      isPrivateChatModalOpen: true,
    });
  }
  
  handleExpandPrivateChat() {
    // Callback khi modal được expand
    // Không cần làm gì, chỉ để PrivateChatModal biết đã expand
  }

  handleExternalOpenPrivateChat() {
    // Mở modal cho cả desktop và mobile
    this.setState({
      isPrivateChatModalOpen: true,
    });
  }

  handleToggleUserList = () => {
    const { layoutContextDispatch, sidebarContent } = this.props;
    
    if (!layoutContextDispatch || !sidebarContent) {
      return;
    }
    
    // Tab-based sidebar: mở sidebar-content với tab People
    if (sidebarContent.isOpen && sidebarContent.sidebarContentPanel === PANELS.USERLIST) {
      // Đóng sidebar nếu đang ở tab People
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
        value: false,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
        value: PANELS.NONE,
      });
    } else {
      // Mở sidebar với tab People
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
        value: true,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
        value: PANELS.USERLIST,
      });
    }
  };

  handleToggleChat = () => {
    const { layoutContextDispatch, sidebarContent } = this.props;
    
    if (!layoutContextDispatch || !sidebarContent) {
      return;
    }
    
    if (sidebarContent.isOpen && sidebarContent.sidebarContentPanel === PANELS.CHAT) {
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
        value: false,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
        value: PANELS.NONE,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_ID_CHAT_OPEN,
        value: '',
      });
    } else {
      // Chỉ mở chat panel, không tự động mở user list sidebar
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
        value: true,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
        value: PANELS.CHAT,
      });
    }
  }

  renderModal(isOpen, setIsOpen, priority, Component, otherOptions) {
    return isOpen ? (
      <Component
        {...{
          ...otherOptions,
          onRequestClose: () => setIsOpen(false),
          priority,
          setIsOpen,
          isOpen,
        }}
      />
    ) : null;
  }

  renderPluginsActionBarItems(position) {
    const { actionBarItems } = this.props;
    return (
      <>
        {
          actionBarItems.filter((plugin) => plugin.position === position).map((plugin) => {
            let actionBarItemToReturn;
            let buttonProps;
            switch (plugin.type) {
              case ActionsBarItemType.BUTTON:
                buttonProps = {
                  key: `${plugin.type}-${plugin.id}`,
                  onClick: plugin.onClick,
                  hideLabel: true,
                  color: 'primary',
                  size: 'lg',
                  circle: true,
                  label: plugin.tooltip,
                  dataTest: plugin.dataTest,
                };
                if (plugin?.icon && typeof plugin.icon === 'object' && 'iconName' in plugin.icon) {
                  buttonProps.icon = plugin.icon.iconName;
                } else if (plugin?.icon && typeof plugin.icon === 'object' && 'svgContent' in plugin.icon) {
                  buttonProps.customIcon = (
                    <i>
                      {plugin.icon.svgContent}
                    </i>
                  );
                }
                actionBarItemToReturn = (
                  <Button
                    {
                      ...buttonProps
                    }
                  />
                );
                break;
              case ActionsBarItemType.SEPARATOR:
                actionBarItemToReturn = (
                  <Separator
                    key={`${plugin.type}-${plugin.id}`}
                    actionsBar
                    icon={plugin.icon}
                    dataTest={plugin.dataTest}
                  />
                );
                break;
              case ActionsBarItemType.SELECTOR:
                actionBarItemToReturn = (
                  <Selector
                    title={plugin.title}
                    options={plugin.options}
                    defaultOption={plugin.defaultOption}
                    onChange={plugin.onChange}
                    width={plugin.width}
                    dataTest={plugin.dataTest}
                  />
                );
                break;
              case ActionsBarItemType.TOGGLE_GROUP:
                actionBarItemToReturn = (
                  <ToggleGroup
                    title={plugin.title}
                    options={plugin.options}
                    defaultOption={plugin.defaultOption}
                    onChange={plugin.onChange}
                    exclusive={plugin.exclusive}
                    dataTest={plugin.dataTest}
                  />
                );
                break;
              default:
                actionBarItemToReturn = null;
                break;
            }
            return actionBarItemToReturn;
          })
        }
      </>
    );
  }

  renderReactionsButton() {
    return (
      <>
        <ReactionsButtonContainer actionsBarRef={this.actionsBarRef} />
      </>
    );
  }

  render() {
    const {
      amIPresenter,
      amIModerator,
      enableVideo,
      presentationIsOpen,
      setPresentationIsOpen,
      intl,
      isSharingVideo,
      isSharedNotesPinned,
      hasScreenshare,
      hasGenericContent,
      hasCameraAsContent,
      stopExternalVideoShare,
      isTimerActive,
      isTimerEnabled,
      isMeteorConnected,
      isPollingEnabled,
      isThereCurrentPresentation,
      allowExternalVideo,
      layoutContextDispatch,
      actionsBarStyle,
      setMeetingLayout,
      showPushLayout,
      setPushLayout,
      setPresentationFitToWidth,
      isPresentationEnabled,
      ariaHidden,
      showScreenshareQuickSwapButton,
      isReactionsButtonEnabled,
      isRaiseHandEnabled,
      meetingName,
      presentationTitle,
      sidebarContent,
      currentUserId,
      isDirectLeaveButtonEnabled,
      privateUnreadCount,
      meetingId,
    } = this.props;

    const { isPrivateChatModalOpen, currentTime } = this.state;

    const Settings = getSettingsSingletonInstance();
    const { selectedLayout } = Settings.application;
    const shouldShowPresentationButton = selectedLayout !== LAYOUT_TYPE.CAMERAS_ONLY
      && selectedLayout !== LAYOUT_TYPE.PARTICIPANTS_AND_CHAT_ONLY;
    const shouldShowVideoButton = selectedLayout !== LAYOUT_TYPE.PRESENTATION_ONLY
      && selectedLayout !== LAYOUT_TYPE.PARTICIPANTS_AND_CHAT_ONLY;
    const shouldRenderActionBar = selectedLayout !== LAYOUT_TYPE.PLUGINS_ONLY;

    const shouldShowOptionsButton = (isPresentationEnabled && isThereCurrentPresentation)
      || isSharingVideo || hasScreenshare || isSharedNotesPinned;

    return shouldRenderActionBar && (
      <Styled.ActionsBarWrapper
        id="ActionsBar"
        role="region"
        aria-label={intl.formatMessage(intlMessages.actionsBarLabel)}
        aria-hidden={ariaHidden}
        style={
          {
            position: 'absolute',
            top: actionsBarStyle.top,
            left: actionsBarStyle.left,
            height: actionsBarStyle.height,
            width: actionsBarStyle.width,
            padding: actionsBarStyle.padding,
          }
        }
      >
        <h2 className="sr-only">{intl.formatMessage(intlMessages.actionsBarLabel)}</h2>
        <Styled.ActionsBar
          ref={this.actionsBarRef}
          style={
            {
              height: actionsBarStyle.innerHeight,
            }
          }
        >
          <Styled.Left>
            <Styled.RoomInfo>
              {/* Time */}
              <Styled.Time>{currentTime}</Styled.Time>
              
              {/* Room name với dropdown */}
              <Styled.Separator aria-hidden="true">|</Styled.Separator>
              <Styled.RoomName
                onClick={() => this.setModalIsOpen(true)}
                data-test="roomName"
              >
                <Tooltip title={intl.formatMessage({ id: 'app.navBar.openDetailsTooltip', defaultMessage: 'Session' })}>
                  <span>
                    {presentationTitle || meetingName || 'Room'}
                    <Icon iconName="device_list_selector" />
                  </span>
                </Tooltip>
              </Styled.RoomName>
              {this.renderModal(this.state.isModalOpen, this.setModalIsOpen, 'low', SessionDetailsModal)}

              {/* ActionsDropdown (nút dấu cộng) - chỉ hiển thị nếu là presenter */}
              {amIPresenter && !deviceInfo.isMobile && (
                <>
                  <Styled.Separator aria-hidden="true">|</Styled.Separator>
                  <ActionsDropdown
                    amIPresenter={amIPresenter}
                    amIModerator={amIModerator}
                    isMeteorConnected={isMeteorConnected}
                    isSharingVideo={isSharingVideo}
                    isPollingEnabled={isPollingEnabled}
                    isTimerActive={isTimerActive}
                    isTimerEnabled={isTimerEnabled}
                    allowExternalVideo={allowExternalVideo}
                    stopExternalVideoShare={stopExternalVideoShare}
                    hasCameraAsContent={hasCameraAsContent}
                    setMeetingLayout={setMeetingLayout}
                    setPushLayout={setPushLayout}
                    showPushLayout={showPushLayout}
                  />
                </>
              )}
            </Styled.RoomInfo>
          </Styled.Left>
          <Styled.Center>
            {this.renderPluginsActionBarItems(ActionsBarPosition.LEFT)}
            <AudioCaptionsButtonContainer />
            <AudioControlsContainer />
            {shouldShowVideoButton && enableVideo
              ? (
                <JoinVideoOptionsContainer />
              )
              : null}
            {shouldShowPresentationButton && (
              <ScreenshareButtonContainer {...{
                amIPresenter,
                isMeteorConnected,
              }}
              />
            )}
            {isReactionsButtonEnabled && this.renderReactionsButton()}
            {isRaiseHandEnabled && <RaiseHandButtonContainer />}
            {this.renderPluginsActionBarItems(ActionsBarPosition.RIGHT)}
          </Styled.Center>
          <Styled.Right>
            <Styled.Gap>
              {/* Mobile: Chỉ hiển thị More menu và Leave button */}
              {deviceInfo.isMobile ? (
                <>
                  <MoreMenu
                    onOpenSettings={() => this.setModalIsOpen(true)}
                    onToggleUserList={this.handleToggleUserList}
                    onToggleChat={this.handleToggleChat}
                    onTogglePrivateChat={this.handleTogglePrivateChat}
                    sidebarContent={sidebarContent}
                    privateUnreadCount={privateUnreadCount}
                  />
                  
                  {/* Leave Meeting button - rõ ràng, màu đỏ */}
                  {isDirectLeaveButtonEnabled && isMeteorConnected && (
                    <LeaveMeetingButtonContainer amIModerator={amIModerator} />
                  )}
                </>
              ) : (
                <>
                  {/* Desktop: Hiển thị tất cả các nút */}
                  {/* Info button - dùng icon settings hoặc custom SVG */}
                  <Button
                    label={intl.formatMessage({ id: 'app.navBar.openDetailsTooltip', defaultMessage: 'Session' })}
                    icon="settings"
                    color="default"
                    size="md"
                    onClick={() => this.setModalIsOpen(true)}
                    hideLabel
                    circle
                    data-test="infoButton"
                  />
                  
                  {/* User List button - dùng icon user (có sẵn) */}
                  <Styled.BadgeWrapper>
                    <Button
                      label={intl.formatMessage({ id: 'app.navBar.userListToggleBtnLabel', defaultMessage: 'Users' })}
                      icon="user"
                      color="default"
                      size="md"
                      onClick={this.handleToggleUserList}
                      hideLabel
                      circle
                      data-test="toggleUserList"
                      aria-expanded={sidebarContent?.isOpen && sidebarContent?.sidebarContentPanel === PANELS.USERLIST}
                    />
                  </Styled.BadgeWrapper>
                  
                  {/* Chat button - dùng icon group_chat cho public chat */}
                  <Styled.BadgeWrapper>
                    <Button
                      label={intl.formatMessage({ id: 'app.chat.title', defaultMessage: 'Chat' })}
                      icon="group_chat"
                      color="default"
                      size="md"
                      onClick={this.handleToggleChat}
                      hideLabel
                      circle
                      data-test="toggleChat"
                      aria-expanded={sidebarContent?.isOpen && sidebarContent?.sidebarContentPanel === PANELS.CHAT}
                    />
                  </Styled.BadgeWrapper>
                  
                  {/* Private Chat button - với badge notification */}
                  <Styled.BadgeWrapper>
                    <Button
                      label={intl.formatMessage({ id: 'app.chat.privateChat', defaultMessage: 'Messages' })}
                      icon="chat"
                      color="default"
                      size="md"
                      onClick={this.handleTogglePrivateChat}
                      hideLabel
                      circle
                      data-test="togglePrivateChat"
                    />
                    {privateUnreadCount > 0 && (
                      <Styled.UnreadBadge>
                        {privateUnreadCount > 99 ? '99+' : privateUnreadCount}
                      </Styled.UnreadBadge>
                    )}
                  </Styled.BadgeWrapper>
                  
                  {/* Options dropdown */}
                  <OptionsDropdownContainer
                    amIModerator={amIModerator}
                    isDirectLeaveButtonEnabled={isDirectLeaveButtonEnabled}
                    showConnectionStatus={ConnectionStatusService.isEnabled()}
                    showLeaveButton={false}
                  />
                  
                  {/* Leave Meeting button - rõ ràng, màu đỏ */}
                  {isDirectLeaveButtonEnabled && isMeteorConnected && (
                    <LeaveMeetingButtonContainer amIModerator={amIModerator} />
                  )}
                </>
              )}
            </Styled.Gap>
          </Styled.Right>
        </Styled.ActionsBar>
        {/* Render PrivateChatNotificationPanel */}
        <PrivateChatNotificationPanel
          isOpen={this.state.isPrivateChatNotificationPanelOpen}
          onClose={this.handleCloseNotificationPanel}
          onSelectChat={this.handleSelectChatFromPanel}
          anchorElement={this.state.privateChatButtonRef}
        />
        
        {/* Render PrivateChatModal cho cả desktop và mobile */}
        <PrivateChatModal
          isOpen={this.state.isPrivateChatModalOpen}
          onRequestClose={() => {
            // Đóng modal trực tiếp, không toggle
            this.setState({ isPrivateChatModalOpen: false });
          }}
          onExpand={this.handleExpandPrivateChat}
        />
      </Styled.ActionsBarWrapper>
    );
  }
}

export default ActionsBar;
