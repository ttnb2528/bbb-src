import React, { useState } from 'react';
import Button from '/imports/ui/components/common/button/component';
import deviceInfo from '/imports/utils/deviceInfo';
import Styled from './styles';

import ActionsDropdownContainer from '../actions-bar/actions-dropdown/container';

interface MobilePanelButtonsProps {
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
  
  // Chỉ hiển thị panel nếu là presenter (để có ActionsDropdown)
  if (!amIPresenter) return null;

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
            {/* Chỉ hiển thị ActionsDropdown nếu là presenter */}
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
    </Styled.Container>
  );
};

export default MobilePanelButtons;

