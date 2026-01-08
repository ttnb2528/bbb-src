import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import BBBMenu from '/imports/ui/components/common/menu/component';
import Button from '/imports/ui/components/common/button/component';
import Styled from './styles';
import { PANELS, ACTIONS } from '../../layout/enums';
import deviceInfo from '/imports/utils/deviceInfo';

const intlMessages = defineMessages({
  moreLabel: {
    id: 'app.actionsBar.moreMenu.moreLabel',
    description: 'More button label',
    defaultMessage: 'More',
  },
  settingsLabel: {
    id: 'app.navBar.openDetailsTooltip',
    description: 'Settings label',
    defaultMessage: 'Session',
  },
  userListLabel: {
    id: 'app.navBar.userListToggleBtnLabel',
    description: 'User list label',
    defaultMessage: 'Users',
  },
  chatLabel: {
    id: 'app.chat.title',
    description: 'Chat label',
    defaultMessage: 'Chat',
  },
  privateChatLabel: {
    id: 'app.chat.privateChat',
    description: 'Private chat label',
    defaultMessage: 'Messages',
  },
});

const propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  onOpenSettings: PropTypes.func.isRequired,
  onToggleUserList: PropTypes.func.isRequired,
  onToggleChat: PropTypes.func.isRequired,
  onTogglePrivateChat: PropTypes.func.isRequired,
  sidebarContent: PropTypes.object,
  privateUnreadCount: PropTypes.number,
};

class MoreMenu extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isDropdownOpen: false,
    };
  }

  renderMenuItems() {
    const {
      intl,
      onOpenSettings,
      onToggleUserList,
      onToggleChat,
      onTogglePrivateChat,
      sidebarContent,
      privateUnreadCount,
    } = this.props;

    const menuItems = [
      {
        key: 'list-item-settings',
        icon: 'settings',
        label: intl.formatMessage(intlMessages.settingsLabel),
        onClick: () => {
          onOpenSettings();
          this.setState({ isDropdownOpen: false });
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
        label: intl.formatMessage(intlMessages.chatLabel),
        onClick: () => {
          onToggleChat();
          this.setState({ isDropdownOpen: false });
        },
        'aria-expanded': sidebarContent?.isOpen && sidebarContent?.sidebarContentPanel === PANELS.CHAT,
      },
      {
        key: 'list-item-private-chat',
        icon: 'chat',
        label: privateUnreadCount > 0
          ? `${intl.formatMessage(intlMessages.privateChatLabel)} (${privateUnreadCount})`
          : intl.formatMessage(intlMessages.privateChatLabel),
        onClick: () => {
          onTogglePrivateChat();
          this.setState({ isDropdownOpen: false });
        },
      },
    ];

    return menuItems;
  }

  render() {
    const { intl } = this.props;
    const { isDropdownOpen } = this.state;

    if (!deviceInfo.isMobile) return null;

    const customStyles = { top: '1rem' };

    return (
      <BBBMenu
        customStyles={customStyles}
        trigger={(
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
    );
  }
}

MoreMenu.propTypes = propTypes;
export default injectIntl(MoreMenu);
