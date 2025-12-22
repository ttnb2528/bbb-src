import React, { useState } from 'react';
import Button from '/imports/ui/components/common/button/component';
import deviceInfo from '/imports/utils/deviceInfo';
import Styled from './styles';

import ActionsDropdownContainer from '../actions-bar/actions-dropdown/container';

interface MobilePanelButtonsProps {
  onToggleUserList: () => void;
  onToggleChatNotes: () => void;
  onTogglePrivateChat: () => void;
  privateUnreadCount: number;
  // Props cho ActionsDropdown
  amIPresenter?: boolean;
  amIModerator?: boolean;
  isMeteorConnected?: boolean;
  isSharingVideo?: boolean;
  isPollingEnabled?: boolean;
  isTimerActive?: boolean;
  isTimerEnabled?: boolean;
  allowExternalVideo?: boolean;
  stopExternalVideoShare?: () => void;
  hasCameraAsContent?: boolean;
  setMeetingLayout?: (layout: string) => void;
  setPushLayout?: (layout: string) => void;
  showPushLayout?: boolean;
}

const MobilePanelButtons: React.FC<MobilePanelButtonsProps> = ({
  onToggleUserList,
  onToggleChatNotes,
  onTogglePrivateChat,
  privateUnreadCount,
  amIPresenter,
  amIModerator,
  isMeteorConnected,
  isSharingVideo,
  isPollingEnabled,
  isTimerActive,
  isTimerEnabled,
  allowExternalVideo,
  stopExternalVideoShare,
  hasCameraAsContent,
  setMeetingLayout,
  setPushLayout,
  showPushLayout,
}) => {
  if (!deviceInfo.isMobile) return null;

  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <Styled.Container>
      <Styled.LeftGroup>
        <Styled.ToggleButtonWrapper>
          <Button
            label={isExpanded ? 'Hide tools' : 'Show tools'}
            icon={isExpanded ? 'left_arrow' : 'right_arrow'}
            color="default"
            size="md"
            onClick={handleToggleExpand}
            hideLabel
            circle
            data-test="mobilePanelToggleButton"
          />
        </Styled.ToggleButtonWrapper>
        {isExpanded && (
          <Styled.ExpandedButtons>
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
            {/* Nút dấu cộng đặt trong panel xổ trái để gọn gàng */}
            <ActionsDropdownContainer
              triggerSize="md"
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
          </Styled.ExpandedButtons>
        )}
      </Styled.LeftGroup>

      <Styled.RightGroup>
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
      </Styled.RightGroup>
    </Styled.Container>
  );
};

export default MobilePanelButtons;

