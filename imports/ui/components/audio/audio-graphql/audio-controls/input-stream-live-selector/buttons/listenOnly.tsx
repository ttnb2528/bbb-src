import React from 'react';
import { useShortcut } from '/imports/ui/core/hooks/useShortcut';
import { defineMessages, useIntl } from 'react-intl';
import Button from '/imports/ui/components/common/button/component';

const intlMessages = defineMessages({
  leaveAudio: {
    id: 'app.audio.leaveAudio',
    description: 'Leave audio dropdown item label',
  },
  changeAudioDevice: {
    id: 'app.audio.changeAudioDevice',
    description: 'Change audio device button label',
  },
});

interface ListenOnlyProps {
  listenOnly: boolean;
  handleLeaveAudio: (meetingIsBreakout: boolean) => void;
  meetingIsBreakout: boolean;
  actAsDeviceSelector: boolean;
  openAudioSettings?: () => void;
}

export const ListenOnly: React.FC<ListenOnlyProps> = ({
  listenOnly,
  handleLeaveAudio,
  meetingIsBreakout,
  actAsDeviceSelector,
  openAudioSettings,
}) => {
  const intl = useIntl();
  const leaveAudioShourtcut = useShortcut('leaveAudio');
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    // Nếu đang ở listen-only mode, mở audio settings để chọn microphone thay vì tắt
    if (listenOnly && openAudioSettings) {
      openAudioSettings();
    } else if (actAsDeviceSelector) {
      // Không làm gì nếu actAsDeviceSelector
      return;
    } else {
      // Nếu không phải listen-only, tắt audio như bình thường
      handleLeaveAudio(meetingIsBreakout);
    }
  };
  
  return (
    // eslint-disable-next-line jsx-a11y/no-access-key
    <Button
      aria-label={listenOnly && openAudioSettings 
        ? intl.formatMessage(intlMessages.changeAudioDevice)
        : intl.formatMessage(intlMessages.leaveAudio)}
      label={actAsDeviceSelector
        ? intl.formatMessage(intlMessages.changeAudioDevice)
        : (listenOnly && openAudioSettings
          ? intl.formatMessage(intlMessages.changeAudioDevice)
          : intl.formatMessage(intlMessages.leaveAudio))}
      accessKey={leaveAudioShourtcut}
      data-test="leaveListenOnly"
      hideLabel
      color="primary"
      icon={listenOnly ? 'listen' : 'volume_level_2'}
      size="lg"
      circle
      onClick={handleClick}
    />
  );
};

export default ListenOnly;
