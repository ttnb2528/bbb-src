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
import PrivateChatHelper from './private-chat-helper/component';
import PrivateChatDock from './private-chat-dock/component';
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
      // Quản lý nhiều popup chat: { [chatId]: { isOpen, isMinimized, position, savedPosition } }
      openPrivateChats: {},
      isPrivateChatNotificationPanelOpen: false,
      isPrivateChatDockOpen: false, // Trạng thái dock bar (khi có nhiều chat minimized)
      privateChatButtonRef: null,
      currentTime: this.getCurrentTime(),
    };
  }

  componentDidMount() {
    // Setup event listeners ngay lập tức, không dùng setTimeout
    window.addEventListener('openPrivateChatModal', this.handleExternalOpenPrivateChat);
    window.addEventListener('clickMinimizedChatIcon', this.handleClickMinimizedChatIcon);
    // Update time every minute
    this.timeInterval = setInterval(() => {
      this.setState({ currentTime: this.getCurrentTime() });
    }, 60000);
  }

  componentWillUnmount() {
    window.removeEventListener('openPrivateChatModal', this.handleExternalOpenPrivateChat);
    window.removeEventListener('clickMinimizedChatIcon', this.handleClickMinimizedChatIcon);
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
      // Kiểm tra xem có chat nào đang minimized không
      const minimizedChats = Object.keys(prevState.openPrivateChats).filter(
        (chatId) => prevState.openPrivateChats[chatId]?.isMinimized
      );
      
      // Nếu có nhiều hơn 1 chat minimized, toggle dock bar
      if (minimizedChats.length > 1) {
        const newDockState = !prevState.isPrivateChatDockOpen;
        return {
          isPrivateChatDockOpen: newDockState,
        };
      }
      
      // Nếu có đúng 1 chat minimized, mở lại chat đó
      if (minimizedChats.length === 1) {
        this.handleExpandPrivateChat(minimizedChats[0]);
        return {
          isPrivateChatDockOpen: false,
        };
      }
      
      // Nếu không có chat minimized, toggle notification panel
      const newPanelState = !prevState.isPrivateChatNotificationPanelOpen;
      
      return {
        isPrivateChatNotificationPanelOpen: newPanelState,
        privateChatButtonRef: newPanelState ? buttonElement : null,
        isPrivateChatDockOpen: false,
      };
    });
  }
  
  handleCloseNotificationPanel = () => {
    this.setState({ isPrivateChatNotificationPanelOpen: false });
  }
  
  handleSelectChatFromPanel = (chatId) => {
    // Mở popup chat mới hoặc mở lại nếu đã tồn tại
    this.setState((prevState) => {
      const existingChat = prevState.openPrivateChats[chatId];
      
      // Nếu chat đã tồn tại và đang minimized, expand nó
      if (existingChat && existingChat.isMinimized) {
        const restoredPosition = existingChat.savedPosition || (() => {
          const modalWidth = 360;
          const modalHeight = 460;
          const paddingRight = 16;
          const paddingBottom = 120;
          return {
            left: window.innerWidth - modalWidth - paddingRight,
            top: window.innerHeight - modalHeight - paddingBottom,
          };
        })();
        
        const newChats = {
          ...prevState.openPrivateChats,
          [chatId]: {
            ...existingChat,
            isOpen: true,
            isMinimized: false,
            position: restoredPosition,
            savedPosition: undefined,
          },
        };
        
        return {
          isPrivateChatNotificationPanelOpen: false,
          openPrivateChats: newChats,
          isPrivateChatDockOpen: false,
        };
      }
      
      // Nếu chat chưa tồn tại hoặc đang đóng, tạo mới hoặc mở lại
      const newChats = {
        ...prevState.openPrivateChats,
        [chatId]: {
          isOpen: true,
          isMinimized: false,
          position: existingChat?.position || null,
        },
      };
      
      return {
        isPrivateChatNotificationPanelOpen: false,
        openPrivateChats: newChats,
      };
    });
  }
  
  handleClickMinimizedChatIcon = (e) => {
    // Xử lý khi click vào icon minimized
    if (!(e instanceof CustomEvent)) return;
    const { chatId } = e.detail || {};
    
    const minimizedChats = Object.keys(this.state.openPrivateChats).filter(
      (id) => this.state.openPrivateChats[id]?.isMinimized
    );
    
    // Nếu có đúng 1 chat minimized, mở lại chat đó
    if (minimizedChats.length === 1) {
      this.handleExpandPrivateChat(chatId);
    } else if (minimizedChats.length > 1) {
      // Nếu có nhiều chat minimized, toggle dock bar
      this.setState((prevState) => ({
        isPrivateChatDockOpen: !prevState.isPrivateChatDockOpen,
      }));
    }
  }
  
  handleExternalOpenPrivateChat = (e) => {
    // Xử lý event từ user list (click "Start Private Chat")
    if (!(e instanceof CustomEvent)) {
      return;
    }
    
    const { userId, chatId } = e.detail || {};
    
    // Nếu có chatId trực tiếp, mở luôn (đây là từ PrivateChatHelper sau khi tìm được chatId)
    if (chatId) {
      // Xử lý ngay lập tức, không dùng setTimeout
      this.setState((prevState) => {
        // Kiểm tra xem chatId này đã được xử lý chưa (tránh duplicate)
        const existingChat = prevState.openPrivateChats[chatId];
        const allChatIds = Object.keys(prevState.openPrivateChats);
        const minimizedChatIds = allChatIds.filter(id => prevState.openPrivateChats[id]?.isMinimized);
        
        if (existingChat?.isOpen && !existingChat?.isMinimized) {
          // Chat đã mở rồi, không làm gì (tránh duplicate)
          return prevState;
        }
        
        // Nếu chat đã tồn tại và đang minimized, expand nó thay vì tạo mới
        if (existingChat && existingChat.isMinimized) {
          // Expand chat này
          const restoredPosition = existingChat.savedPosition || (() => {
            const modalWidth = 360;
            const modalHeight = 460;
            const paddingRight = 16;
            const paddingBottom = 120;
            return {
              left: window.innerWidth - modalWidth - paddingRight,
              top: window.innerHeight - modalHeight - paddingBottom,
            };
          })();
          
          const newChats = {
            ...prevState.openPrivateChats,
            [chatId]: {
              ...existingChat,
              isMinimized: false,
              position: restoredPosition,
              savedPosition: undefined,
            },
          };
          return { 
            openPrivateChats: newChats,
            isPrivateChatDockOpen: false,
          };
        }
        
        // Nếu chat chưa tồn tại hoặc đang đóng, tạo mới hoặc mở lại
        // Đảm bảo các chat minimized khác vẫn giữ nguyên trạng thái minimized
        const newChats = {
          ...prevState.openPrivateChats,
          [chatId]: {
            isOpen: true,
            isMinimized: false,
            position: existingChat?.position || null,
          },
        };
        return { 
          openPrivateChats: newChats,
          isPrivateChatDockOpen: false, // Đóng dock khi mở chat mới
        };
      });
      return;
    }
    
    // Nếu có userId, dispatch event để PrivateChatHelper tìm chatId
    if (userId) {
      window.dispatchEvent(new CustomEvent('findChatIdFromUserId', {
        detail: { userId },
      }));
    } else {
    }
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

  handleClosePrivateChat = (chatId) => {
    // Đóng popup chat và xóa khỏi state (bao gồm cả minimized icon)
    this.setState((prevState) => {
      const newChats = { ...prevState.openPrivateChats };
      delete newChats[chatId];
      return { 
        openPrivateChats: newChats,
        isPrivateChatDockOpen: false, // Đóng dock nếu đang mở
      };
    });
  }
  
  handleMinimizePrivateChat = (chatId, savedPosition) => {
    // Thu nhỏ popup chat về vị trí dock cố định
    // Tất cả các chat minimized đều về cùng 1 vị trí
    const iconSize = 56;
    const defaultDockPosition = {
      left: window.innerWidth - iconSize - 16,
      top: window.innerHeight - iconSize - 96, // tránh đè actions bar
    };
    
    this.setState((prevState) => {
      const prevChatState = prevState.openPrivateChats[chatId];
      // Nếu đã có dockPosition (do kéo icon), ưu tiên dùng lại, nếu chưa thì dùng default
      const dockPosition = prevChatState?.dockPosition || defaultDockPosition;
      const newChats = {
        ...prevState.openPrivateChats,
        [chatId]: {
          ...prevChatState,
          isMinimized: true,
          position: dockPosition, // Vị trí icon hiện tại/dock
          dockPosition, // Lưu vị trí dock để dùng lại
          savedPosition: savedPosition || prevChatState?.savedPosition, // Vị trí popup trước khi minimize
        },
      };
      return { openPrivateChats: newChats };
    });
  }
  
  handleExpandPrivateChat = (chatId, iconPosition = null) => {
    // Mở lại popup chat từ minimized
    // Mở ở vị trí icon hiện tại (đã được cập nhật khi kéo) thay vì savedPosition
    this.setState((prevState) => {
      const chatState = prevState.openPrivateChats[chatId];
      if (!chatState) return prevState;
      
      // Lấy vị trí icon hiện tại (đã được cập nhật khi kéo)
      const currentIconPosition = iconPosition || chatState.dockPosition || chatState.position;
      
      // Tính toán vị trí popup: mở ở vị trí icon, nhưng điều chỉnh để popup không bị lệch
      // Popup có width 360px, icon có width 56px, nên cần offset
      const modalWidth = 360;
      const modalHeight = 460;
      const iconSize = 56;
      
      // Mở popup ở vị trí icon, nhưng offset để popup không che icon
      // Nếu icon ở bên phải màn hình, mở popup về bên trái icon
      // Nếu icon ở bên trái, mở popup về bên phải icon
      const expandPosition = currentIconPosition ? {
        left: currentIconPosition.left - modalWidth + iconSize, // Offset để popup không che icon
        top: currentIconPosition.top - modalHeight + iconSize, // Offset lên trên
      } : (() => {
        // Fallback nếu không có position
        const paddingRight = 16;
        const paddingBottom = 120;
        return {
          left: window.innerWidth - modalWidth - paddingRight,
          top: window.innerHeight - modalHeight - paddingBottom,
        };
      })();
      
      // Đảm bảo popup không ra ngoài màn hình
      expandPosition.left = Math.max(16, Math.min(expandPosition.left, window.innerWidth - modalWidth - 16));
      expandPosition.top = Math.max(16, Math.min(expandPosition.top, window.innerHeight - modalHeight - 16));
      
      const newChats = {
        ...prevState.openPrivateChats,
        [chatId]: {
          ...chatState,
          isMinimized: false,
          position: expandPosition, // Mở ở vị trí icon hiện tại
          savedPosition: chatState.savedPosition, // Giữ savedPosition để có thể restore sau
          dockPosition: currentIconPosition, // Lưu lại vị trí icon hiện tại
        },
      };
      return { 
        openPrivateChats: newChats,
        isPrivateChatDockOpen: false,
      };
    });
  }
  
  handleUpdateChatPosition = (chatId, position) => {
    // Cập nhật vị trí popup chat (kể cả khi minimized để icon kéo được)
    this.setState((prevState) => {
      if (!prevState.openPrivateChats[chatId]) return prevState;
      const chatState = prevState.openPrivateChats[chatId];
      const newChats = {
        ...prevState.openPrivateChats,
        [chatId]: {
          ...chatState,
          position,
          // Khi đang minimized và kéo icon, cập nhật dockPosition theo vị trí kéo
          dockPosition: chatState.isMinimized ? position : chatState.dockPosition,
          // Giữ savedPosition (vị trí popup trước khi minimize) không đổi
          savedPosition: chatState.savedPosition,
        },
      };
      return { openPrivateChats: newChats };
    });
  }
  
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
        
        {/* Helper component để query chats và tìm chatId từ userId */}
        <PrivateChatHelper />
        
        {/* Render nhiều PrivateChatModal - mỗi chatId một popup hoặc icon */}
        {(() => {
          const minimizedChats = Object.keys(this.state.openPrivateChats).filter(
            (chatId) => this.state.openPrivateChats[chatId]?.isMinimized
          );
          
          return Object.keys(this.state.openPrivateChats).map((chatId) => {
            const chatState = this.state.openPrivateChats[chatId];
            if (!chatState?.isOpen) return null;
            
            // Nếu chat đang minimized
            if (chatState.isMinimized) {
              // Chỉ render icon cho chat cuối cùng (hoặc chat duy nhất) để tránh duplicate
              // Các chat khác sẽ hiển thị trong dock bar khi mở
              const isLastMinimized = chatId === minimizedChats[minimizedChats.length - 1];
              const shouldRender = minimizedChats.length === 1 || isLastMinimized;
              
              if (!shouldRender) {
                // Không render icon cho các chat minimized trước chat cuối
                // Chúng sẽ được hiển thị trong dock bar
                return null;
              }
              
              return (
                <PrivateChatModal
                  key={chatId}
                  chatId={chatId}
                  isOpen={true}
                  isMinimized={true}
                  initialPosition={chatState.dockPosition || chatState.position}
                  onRequestClose={() => this.handleClosePrivateChat(chatId)}
                  onMinimize={(position) => this.handleMinimizePrivateChat(chatId, position)}
                  onExpand={() => this.handleExpandPrivateChat(chatId)}
                  onPositionUpdate={(position) => this.handleUpdateChatPosition(chatId, position)}
                />
              );
            }
            
            // Nếu chat đang mở (không minimized), render popup
            return (
              <PrivateChatModal
                key={chatId}
                chatId={chatId}
                isOpen={chatState.isOpen}
                isMinimized={false}
                initialPosition={chatState.position}
                onRequestClose={() => this.handleClosePrivateChat(chatId)}
                onMinimize={(position) => this.handleMinimizePrivateChat(chatId, position)}
                onExpand={() => this.handleExpandPrivateChat(chatId)}
                onPositionUpdate={(position) => this.handleUpdateChatPosition(chatId, position)}
              />
            );
          });
        })()}
        
        {/* Render dock bar khi có nhiều chat minimized */}
        {(() => {
          const minimizedChats = Object.keys(this.state.openPrivateChats).filter(
            (chatId) => this.state.openPrivateChats[chatId]?.isMinimized
          );
          
          if (minimizedChats.length <= 1) return null; // Chỉ hiển thị dock khi có nhiều hơn 1 chat
          
          // Lấy vị trí của icon minimized cuối cùng (icon đang hiển thị)
          const lastMinimizedChatId = minimizedChats[minimizedChats.length - 1];
          const lastChatState = this.state.openPrivateChats[lastMinimizedChatId];
          const anchorPosition = lastChatState?.position || null;
          
          return (
            <PrivateChatDock
              isOpen={this.state.isPrivateChatDockOpen}
              minimizedChats={minimizedChats}
              onClose={() => this.setState({ isPrivateChatDockOpen: false })}
              onSelectChat={(chatId, iconPosition) => this.handleExpandPrivateChat(chatId, iconPosition)}
              anchorPosition={anchorPosition || undefined}
            />
          );
        })()}
      </Styled.ActionsBarWrapper>
    );
  }
}

export default ActionsBar;
