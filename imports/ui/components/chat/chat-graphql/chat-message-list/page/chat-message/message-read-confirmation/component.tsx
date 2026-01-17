import React from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { Message } from '/imports/ui/Types/message';
import Auth from '/imports/ui/services/auth';
import Tooltip from '/imports/ui/components/common/tooltip/component';
import { ReadIcon, IconWrapper, DoubleCheckWrapper, DoubleCheckIcon } from './styles';

const intlMessages = defineMessages({
  messageReadLabel: {
    id: 'app.chat.messageRead',
    description: 'Label for the message read indicator',
  },
  messageSentLabel: {
    id: 'app.chat.messageSent',
    description: 'Label for the message sent indicator',
  },
});

interface MessageReadConfirmationProps {
  message: Message;
}

const CONFIRMATION_READ_ICON = 'check';

const MessageReadConfirmation: React.FC<MessageReadConfirmationProps> = ({
  message,
}) => {
  const intl = useIntl();
  const isFromMe = Auth.userID === message?.user?.userId;

  // Chỉ hiển thị cho tin nhắn của chính mình
  if (!isFromMe) return null;

  // Nếu đã xem: hiển thị check đôi (✓✓) màu xanh
  if (message.recipientHasSeen) {
    return (
      <Tooltip title={intl.formatMessage(intlMessages.messageReadLabel)}>
        <IconWrapper>
          <DoubleCheckWrapper>
            <DoubleCheckIcon iconName={CONFIRMATION_READ_ICON} />
            <DoubleCheckIcon iconName={CONFIRMATION_READ_ICON} />
          </DoubleCheckWrapper>
        </IconWrapper>
      </Tooltip>
    );
  }

  // Nếu chưa xem: hiển thị check đơn (✓) màu xám
  return (
    <Tooltip title={intl.formatMessage(intlMessages.messageSentLabel)}>
      <IconWrapper>
        <ReadIcon iconName={CONFIRMATION_READ_ICON} />
      </IconWrapper>
    </Tooltip>
  );
};

export default MessageReadConfirmation;
