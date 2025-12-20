import React from 'react';
import Button from '/imports/ui/components/common/button/component';
import deviceInfo from '/imports/utils/deviceInfo';
import Styled from './styles';

interface MobilePanelButtonsProps {
  onToggleUserList: () => void;
  onToggleChatNotes: () => void;
  onTogglePrivateChat: () => void;
  privateUnreadCount: number;
}

const MobilePanelButtons: React.FC<MobilePanelButtonsProps> = ({
  onToggleUserList,
  onToggleChatNotes,
  onTogglePrivateChat,
  privateUnreadCount,
}) => {
  if (!deviceInfo.isMobile) return null;

  return (
    <Styled.Container>
      <Button
        label="Users"
        icon="user"
        color="default"
        size="md"
        onClick={onToggleUserList}
        hideLabel
        circle
        data-test="mobileUserListButton"
      />
      <Styled.BadgeWrapper>
        <Button
          label="Message"
          icon="chat"
          color="primary"
          size="md"
          onClick={onTogglePrivateChat}
          hideLabel
          circle
          data-test="mobilePrivateChatButton"
        />
        {privateUnreadCount > 0 && (
          <Styled.UnreadBadge>{privateUnreadCount}</Styled.UnreadBadge>
        )}
      </Styled.BadgeWrapper>
      <Button
        label="Chat & Notes"
        icon="note"
        color="default"
        size="md"
        onClick={onToggleChatNotes}
        hideLabel
        circle
        data-test="mobileChatNotesButton"
      />
    </Styled.Container>
  );
};

export default MobilePanelButtons;

