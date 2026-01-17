import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import BBBMenu from '/imports/ui/components/common/menu/component';
import Button from '/imports/ui/components/common/button/component';
import Styled from './styles';
import { PANELS, ACTIONS } from '../../layout/enums';
import deviceInfo from '/imports/utils/deviceInfo';
import AboutContainer from '/imports/ui/components/about/container';
import ShortcutHelpComponent from '/imports/ui/components/shortcut-help/component';
import OptionsMenuContainer from '/imports/ui/components/settings/container';
import FullscreenService from '/imports/ui/components/common/fullscreen-button/service';
import ConnectionStatusModalContainer from '/imports/ui/components/connection-status/modal/container';
import browserInfo from '/imports/utils/browserInfo';

const intlMessages = defineMessages({
  moreLabel: {
    id: 'app.actionsBar.moreMenu.moreLabel',
    description: 'More button label',
    defaultMessage: 'More',
  },
  settingsLabel: {
    id: 'app.navBar.optionsDropdown.settingsLabel',
    description: 'Settings label',
    defaultMessage: 'Settings',
  },
  userListLabel: {
    id: 'app.navBar.userListToggleBtnLabel',
    description: 'User list label',
    defaultMessage: 'Users',
  },
  chatLabel: {
    id: 'app.chat.titlePublic',
    description: 'Public chat label',
    defaultMessage: 'Public Chat',
  },
  fullscreenLabel: {
    id: 'app.navBar.optionsDropdown.fullscreenLabel',
    description: 'Fullscreen label',
  },
  exitFullscreenLabel: {
    id: 'app.navBar.optionsDropdown.exitFullscreenLabel',
    description: 'Exit fullscreen label',
  },
  aboutLabel: {
    id: 'app.navBar.optionsDropdown.aboutLabel',
    description: 'About label',
  },
  helpLabel: {
    id: 'app.navBar.optionsDropdown.helpLabel',
    description: 'Help label',
  },
  hotkeysLabel: {
    id: 'app.navBar.optionsDropdown.hotkeysLabel',
    description: 'Hotkeys label',
  },
  connectionStatusLabel: {
    id: 'app.navBar.optionsDropdown.connectionStatusLabel',
    description: 'Connection Status label',
    defaultMessage: 'Connection Status',
  },
});

const propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  onToggleUserList: PropTypes.func.isRequired,
  onToggleChat: PropTypes.func.isRequired,
  sidebarContent: PropTypes.object,
  // Props cho Activities menu (ActionsDropdown)
  amIPresenter: PropTypes.bool,
  onOpenActivities: PropTypes.func,
  // Props từ OptionsDropdown
  handleToggleFullscreen: PropTypes.func,
  showConnectionStatus: PropTypes.bool,
  isMeteorConnected: PropTypes.bool,
  // Props cho unread badge
  publicChatUnreadCount: PropTypes.number,
  privateUnreadCount: PropTypes.number,
};

const { isSafari, isValidSafariVersion } = browserInfo;
const { isIphone } = deviceInfo;
const noIOSFullscreen = !!(((isSafari && !isValidSafariVersion) || isIphone));
const FULLSCREEN_CHANGE_EVENT = isSafari ? 'webkitfullscreenchange' : 'fullscreenchange';

class MoreMenu extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isDropdownOpen: false,
      isAboutModalOpen: false,
      isShortcutHelpModalOpen: false,
      isOptionsMenuModalOpen: false,
      isConnectionStatusModalOpen: false,
      isFullscreen: false,
    };
    this.onFullscreenChange = this.onFullscreenChange.bind(this);
  }

  componentDidMount() {
    document.documentElement.addEventListener(FULLSCREEN_CHANGE_EVENT, this.onFullscreenChange);
  }

  componentWillUnmount() {
    document.documentElement.removeEventListener(FULLSCREEN_CHANGE_EVENT, this.onFullscreenChange);
  }

  onFullscreenChange() {
    const { isFullscreen } = this.state;
    const newIsFullscreen = FullscreenService.isFullScreen(document.documentElement);
    if (isFullscreen !== newIsFullscreen) {
      this.setState({ isFullscreen: newIsFullscreen });
    }
  }

  renderMenuItems() {
    const {
      intl,
      onOpenSettings,
      onToggleUserList,
      onToggleChat,
      sidebarContent,
      amIPresenter,
      onOpenActivities,
      handleToggleFullscreen,
      showConnectionStatus,
      publicChatUnreadCount,
      privateUnreadCount,
    } = this.props;

    const { isFullscreen } = this.state;
    const ALLOW_FULLSCREEN = window.meetingClientSettings?.public?.app?.allowFullscreen;
    const { showHelpButton: helpButton, helpLink } = window.meetingClientSettings?.public?.app || {};

    const menuItems = [
      {
        key: 'list-item-settings',
        icon: 'settings',
        label: intl.formatMessage(intlMessages.settingsLabel),
        onClick: () => {
          this.setState({ isOptionsMenuModalOpen: true, isDropdownOpen: false });
        },
      },
      {
        key: 'separator-01',
        isSeparator: true,
      },
      {
        key: 'list-item-user-list',
        icon: 'user',
        label: intl.formatMessage(intlMessages.userListLabel),
        onClick: () => {
          onToggleUserList();
          this.setState({ isDropdownOpen: false });
        },
        'aria-expanded': sidebarContent?.isOpen && sidebarContent?.sidebarContentPanel === PANELS.USERLIST,
      },
      {
        key: 'list-item-chat',
        icon: 'group_chat',
        label: (() => {
          // Tính tổng unread count (public + private) để hiển thị trong menu
          const totalUnreadInMenu = (publicChatUnreadCount || 0) + (privateUnreadCount || 0);
          return (
            <Styled.MenuItemLabel>
              <span>{intl.formatMessage(intlMessages.chatLabel)}</span>
              {totalUnreadInMenu > 0 && (
                <Styled.MenuItemBadge>
                  {totalUnreadInMenu > 99 ? '99+' : totalUnreadInMenu}
                </Styled.MenuItemBadge>
              )}
            </Styled.MenuItemLabel>
          );
        })(),
        onClick: () => {
          onToggleChat();
          this.setState({ isDropdownOpen: false });
        },
        'aria-expanded': sidebarContent?.isOpen && sidebarContent?.sidebarContentPanel === PANELS.CHAT,
      },
    ];

    // Thêm menu item "Activities" cho presenter
    if (amIPresenter && onOpenActivities) {
      menuItems.push(
        {
          key: 'separator-activities',
          isSeparator: true,
        },
        {
          key: 'list-item-activities',
          icon: 'plus',
          label: intl.formatMessage({
            id: 'app.actionsBar.actionsDropdown.actionsLabel',
            defaultMessage: 'Activities',
          }),
          onClick: () => {
            onOpenActivities();
            this.setState({ isDropdownOpen: false });
          },
        }
      );
    }

    // Thêm separator trước các options từ desktop
    menuItems.push({
      key: 'separator-options',
      isSeparator: true,
    });

    // Fullscreen option
    if (!noIOSFullscreen && ALLOW_FULLSCREEN && handleToggleFullscreen) {
      const fullscreenLabel = isFullscreen
        ? intl.formatMessage(intlMessages.exitFullscreenLabel)
        : intl.formatMessage(intlMessages.fullscreenLabel);
      const fullscreenIcon = isFullscreen ? 'exit_fullscreen' : 'fullscreen';

      menuItems.push({
        key: 'list-item-fullscreen',
        icon: fullscreenIcon,
        label: fullscreenLabel,
        onClick: () => {
          handleToggleFullscreen();
          this.setState({ isDropdownOpen: false });
        },
      });
    }

    // About option
    menuItems.push({
      key: 'list-item-about',
      icon: 'about',
      label: intl.formatMessage(intlMessages.aboutLabel),
      onClick: () => {
        this.setState({ isAboutModalOpen: true, isDropdownOpen: false });
      },
    });

    // Help option
    if (helpButton) {
      menuItems.push({
        key: 'list-item-help',
        icon: 'help',
        iconRight: 'popout_window',
        label: intl.formatMessage(intlMessages.helpLabel),
        onClick: () => {
          if (helpLink) {
            window.open(helpLink);
          }
          this.setState({ isDropdownOpen: false });
        },
      });
    }

    // Keyboard shortcuts
    menuItems.push({
      key: 'list-item-shortcuts',
      icon: 'shortcuts',
      label: intl.formatMessage(intlMessages.hotkeysLabel),
      onClick: () => {
        this.setState({ isShortcutHelpModalOpen: true, isDropdownOpen: false });
      },
    });

    // Connection Status
    if (showConnectionStatus) {
      menuItems.push({
        key: 'separator-connection',
        isSeparator: true,
      });
      menuItems.push({
        key: 'list-item-connection-status',
        icon: 'network',
        label: intl.formatMessage(intlMessages.connectionStatusLabel),
        onClick: () => {
          this.setState({ isConnectionStatusModalOpen: true, isDropdownOpen: false });
        },
      });
    }

    return menuItems;
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

  render() {
    const { intl, publicChatUnreadCount, privateUnreadCount, sidebarContent } = this.props;
    const {
      isDropdownOpen,
      isAboutModalOpen,
      isShortcutHelpModalOpen,
      isOptionsMenuModalOpen,
      isConnectionStatusModalOpen,
    } = this.state;

    if (!deviceInfo.isMobile) return null;

    const customStyles = { top: '1rem' };
    
    // Kiểm tra panel chat có đang mở không
    const isChatPanelOpen = sidebarContent?.isOpen && sidebarContent?.sidebarContentPanel === PANELS.CHAT;
    
    // Tính tổng unread count (public + private)
    const totalUnreadCount = (publicChatUnreadCount || 0) + (privateUnreadCount || 0);
    
    // Hiển thị badge khi panel đóng và có tin nhắn chưa đọc
    const shouldShowBadge = totalUnreadCount > 0 && !isChatPanelOpen;

    return (
      <>
        <BBBMenu
          customStyles={customStyles}
          trigger={(
            <Styled.BadgeWrapper>
              <Styled.MoreButton
                label={intl.formatMessage(intlMessages.moreLabel)}
                icon="more"
                data-test="moreMenuButton"
                color="default"
                size="md"
                circle
                hideLabel
                onClick={() => null}
              />
              {shouldShowBadge && (
                <Styled.UnreadBadge>
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Styled.UnreadBadge>
              )}
            </Styled.BadgeWrapper>
          )}
          actions={this.renderMenuItems()}
          opts={{
            id: 'actions-bar-more-menu',
            keepMounted: true,
            transitionDuration: 120, // mượt hơn khi mở
            elevation: 3,
            getcontentanchorel: null,
            fullwidth: 'true',
            anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
            transformorigin: { vertical: 'top', horizontal: 'right' },
          }}
          onCloseCallback={() => {
            this.setState({ isDropdownOpen: false });
          }}
        />
        {this.renderModal(isAboutModalOpen, (value) => this.setState({ isAboutModalOpen: value }), 'low', AboutContainer)}
        {this.renderModal(isShortcutHelpModalOpen, (value) => this.setState({ isShortcutHelpModalOpen: value }), 'low', ShortcutHelpComponent)}
        {this.renderModal(isOptionsMenuModalOpen, (value) => this.setState({ isOptionsMenuModalOpen: value }), 'low', OptionsMenuContainer)}
        {isConnectionStatusModalOpen && (
          <ConnectionStatusModalContainer
            isModalOpen={isConnectionStatusModalOpen}
            setModalIsOpen={(value) => this.setState({ isConnectionStatusModalOpen: value })}
          />
        )}
      </>
    );
  }
}

MoreMenu.propTypes = propTypes;
export default injectIntl(MoreMenu);
