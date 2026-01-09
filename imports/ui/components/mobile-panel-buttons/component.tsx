import React from 'react';
import deviceInfo from '/imports/utils/deviceInfo';

interface MobilePanelButtonsProps {
  // Props giữ lại để tránh breaking changes
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

const MobilePanelButtons: React.FC<MobilePanelButtonsProps> = () => {
  // Không hiển thị panel nữa vì đã có Activities trong More menu
  // Component này được giữ lại để tránh breaking changes nhưng không render gì
  if (!deviceInfo.isMobile) return null;
  
  return null;
};

export default MobilePanelButtons;

