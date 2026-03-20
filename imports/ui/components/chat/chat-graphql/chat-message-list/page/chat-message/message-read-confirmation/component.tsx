import React from "react";
import { useIntl, defineMessages } from "react-intl";
import { Message } from "/imports/ui/Types/message";
import Auth from "/imports/ui/services/auth";
import Tooltip from "/imports/ui/components/common/tooltip/component";
import { SingleCheckSVG, DoubleCheckSVG, IconWrapper } from "./styles";

const intlMessages = defineMessages({
  messageReadLabel: {
    id: "app.chat.messageRead",
    description: "Label for the message read indicator",
  },
  messageSentLabel: {
    id: "app.chat.messageSent",
    description: "Label for the message sent indicator",
  },
});

interface MessageReadConfirmationProps {
  message: Message;
}

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
          <DoubleCheckSVG viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
          </DoubleCheckSVG>
        </IconWrapper>
      </Tooltip>
    );
  }

  // Nếu chưa xem: hiển thị check đơn (✓) màu xám
  return (
    <Tooltip title={intl.formatMessage(intlMessages.messageSentLabel)}>
      <IconWrapper>
        <SingleCheckSVG viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </SingleCheckSVG>
      </IconWrapper>
    </Tooltip>
  );
};

export default MessageReadConfirmation;
