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
import deviceInfo from '/imports/utils/deviceInfo';

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

    this.state = {
      isModalOpen: false,
      isPrivateChatModalOpen: false,
    };
  }

  componentDidMount() {
    window.addEventListener('openPrivateChatModal', this.handleExternalOpenPrivateChat);
  }

  componentWillUnmount() {
    window.removeEventListener('openPrivateChatModal', this.handleExternalOpenPrivateChat);
  }

  setModalIsOpen(isOpen) {
    this.setState({ isModalOpen: isOpen });
  }

  handleTogglePrivateChat() {
    this.setState((prevState) => ({
      isPrivateChatModalOpen: !prevState.isPrivateChatModalOpen,
    }));
  }

  handleExternalOpenPrivateChat() {
    this.setState({
      isPrivateChatModalOpen: true,
    });
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
    } = this.props;

    const { isPrivateChatModalOpen } = this.state;

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
              <Styled.RoomName
                onClick={() => this.setModalIsOpen(true)}
                data-test="roomName"
              >
                <Tooltip title={intl.formatMessage({ id: 'app.navBar.openDetailsTooltip' })}>
                  <span>
                    {presentationTitle || meetingName || 'Room'}
                    <Icon iconName="device_list_selector" />
                  </span>
                </Tooltip>
              </Styled.RoomName>
              {this.renderModal(this.state.isModalOpen, this.setModalIsOpen, 'low', SessionDetailsModal)}
              <Styled.Separator aria-hidden="true">|</Styled.Separator>
              <RecordingIndicatorContainer
                amIModerator={amIModerator}
                currentUserId={currentUserId}
              />
              <LiveIndicator />
              {/* ActionsDropdown (nút dấu cộng) - chỉ hiển thị trên desktop, sau LiveIndicator */}
              {!deviceInfo.isMobile && (
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
              {/* Mobile: ẩn private chat button ở footer, sẽ có trong panel buttons */}
              {!deviceInfo.isMobile && (
                <Styled.BadgeWrapper>
                  <Button
                    label="Message"
                    icon="chat"
                    color="primary"
                    size="md"
                    onClick={this.handleTogglePrivateChat}
                    data-test="privateChatButton"
                    hideLabel
                    circle
                  />
                  {privateUnreadCount > 0 && (
                    <Styled.UnreadBadge>{privateUnreadCount}</Styled.UnreadBadge>
                  )}
                </Styled.BadgeWrapper>
              )}
              {/* Ẩn 3 nút bên phải, đưa vào options dropdown */}
              {/* ConnectionStatus, LeaveMeeting, OptionsDropdown sẽ được thêm vào options dropdown menu */}
              <OptionsDropdownContainer
                amIModerator={amIModerator}
                isDirectLeaveButtonEnabled={isDirectLeaveButtonEnabled}
                showConnectionStatus={ConnectionStatusService.isEnabled()}
                showLeaveButton={isDirectLeaveButtonEnabled && isMeteorConnected}
                  />
            </Styled.Gap>
          </Styled.Right>
        </Styled.ActionsBar>
        <PrivateChatModal
          isOpen={this.state.isPrivateChatModalOpen}
          onRequestClose={this.handleTogglePrivateChat}
        />
      </Styled.ActionsBarWrapper>
    );
  }
}

export default ActionsBar;
