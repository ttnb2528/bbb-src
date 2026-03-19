import { gql } from "@apollo/client";

export const CHAT_MESSAGE_FLOATING_SUBSCRIPTION = gql`
  subscription chatMessagesFloating($limit: Int!) {
    chat_message_public(limit: $limit, order_by: { createdAt: desc }) {
      user {
        name
        userId
        avatar
        color
      }
      messageSequence
      messageType
      chatId
      message
      messageId
      createdAt
      senderName
      senderRole
    }
  }
`;
