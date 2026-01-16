import React, { useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useChat from '/imports/ui/core/hooks/useChat';
import { Chat } from '/imports/ui/Types/chat';
import { GraphqlDataHookSubscriptionResponse } from '/imports/ui/Types/hook';
import { colorPrimary } from '/imports/ui/stylesheets/styled-components/palette';
import Styled from './styles';

const intlMessages = defineMessages({
  privateChatLabel: {
    id: 'app.chat.privateChat',
    description: 'Private chat label',
    defaultMessage: 'Private Messages',
  },
  noPrivateChats: {
    id: 'app.chat.noPrivateChats',
    description: 'No private chats',
    defaultMessage: 'No private messages',
  },
});

interface PrivateChatSidebarProps {
  onSelectChat: (chatId: string) => void;
}

const PrivateChatSidebar: React.FC<PrivateChatSidebarProps> = ({ onSelectChat }) => {
  const intl = useIntl();

  const { data: chats } = useChat((chat) => ({
    chatId: chat.chatId,
    participant: chat.participant,
    totalUnread: chat.totalUnread,
  })) as GraphqlDataHookSubscriptionResponse<Partial<Chat>[]>;

  // Lọc private chats (loại bỏ public chat)
  const CHAT_CONFIG = window.meetingClientSettings.public.chat;
  const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;

  // Chỉ hiển thị các private chats có tin nhắn (có unread hoặc đã từng có tin nhắn)
  // Hoặc có thể hiển thị tất cả private chats - bạn có thể điều chỉnh logic này
  const privateChats = useMemo(() => {
    if (!chats) return [];
    return chats.filter(
      (c) => c.chatId && c.chatId !== PUBLIC_GROUP_CHAT_ID
    );
  }, [chats]);

  const handleChatClick = (chatId: string) => {
    // Dispatch event để Actions Bar mở private chat modal
    // Format event giống với PrivateChatHelper và handleExternalOpenPrivateChat trong ActionsBar
    window.dispatchEvent(new CustomEvent('openPrivateChatModal', {
      detail: { chatId },
    }));
    onSelectChat(chatId);
  };

  return (
    <Styled.Sidebar>
      <Styled.Header>
        <Styled.HeaderTitle>
          {intl.formatMessage(intlMessages.privateChatLabel)}
        </Styled.HeaderTitle>
      </Styled.Header>
      
      <Styled.ChatList>
        {privateChats.length === 0 ? (
          <Styled.EmptyState>
            {intl.formatMessage(intlMessages.noPrivateChats)}
          </Styled.EmptyState>
        ) : (
          privateChats.map((chat) => {
            const participantColor = chat.participant?.color;
            const avatarColor = participantColor 
              ? (participantColor.startsWith('#') ? participantColor : `#${participantColor}`)
              : colorPrimary;
            
            const unreadCount = chat.totalUnread || 0;
            const participantName = chat.participant?.name || '';
            const avatarText = chat.participant?.avatar?.length === 0
              ? participantName.toLowerCase().slice(0, 2)
              : '';
            
            return (
              <Styled.ChatItem
                key={chat.chatId}
                onClick={() => chat.chatId && handleChatClick(chat.chatId)}
                title={participantName}
                $hasUnread={unreadCount > 0}
              >
                <Styled.AvatarWrapper>
                  <Styled.Avatar
                    moderator={chat.participant?.role === window.meetingClientSettings.public.user.role_moderator}
                    avatar={chat.participant?.avatar || ''}
                    style={{ backgroundColor: avatarColor }}
                  >
                    {avatarText}
                  </Styled.Avatar>
                  {unreadCount > 0 && (
                    <Styled.UnreadBadge>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Styled.UnreadBadge>
                  )}
                </Styled.AvatarWrapper>
              </Styled.ChatItem>
            );
          })
        )}
      </Styled.ChatList>
    </Styled.Sidebar>
  );
};

export default PrivateChatSidebar;
