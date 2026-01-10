import React, { useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import Styled from './styles';
import useChat from '/imports/ui/core/hooks/useChat';
import { Chat } from '/imports/ui/Types/chat';
import { GraphqlDataHookSubscriptionResponse } from '/imports/ui/Types/hook';
import deviceInfo from '/imports/utils/deviceInfo';
import { colorPrimary } from '/imports/ui/stylesheets/styled-components/palette';

const intlMessages = defineMessages({
  noNewMessages: {
    id: 'app.chat.noNewMessages',
    description: 'No new messages',
    defaultMessage: 'No new messages',
  },
  newMessages: {
    id: 'app.chat.newMessages',
    description: 'New messages',
    defaultMessage: 'New messages',
  },
});

interface PrivateChatNotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  anchorElement: HTMLElement | null;
}

const PrivateChatNotificationPanel: React.FC<PrivateChatNotificationPanelProps> = ({
  isOpen,
  onClose,
  onSelectChat,
  anchorElement,
}) => {
  const intl = useIntl();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: chats } = useChat((chat) => ({
    chatId: chat.chatId,
    participant: chat.participant,
    totalUnread: chat.totalUnread,
  })) as GraphqlDataHookSubscriptionResponse<Partial<Chat>[]>;

  // Lọc tất cả private chats (không chỉ những chat có unread)
  const CHAT_CONFIG = window.meetingClientSettings.public.chat;
  const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
  const allPrivateChats = chats?.filter(
    (c) => c.chatId && c.chatId !== PUBLIC_GROUP_CHAT_ID
  ) || [];

  // Đóng panel khi click bên ngoài
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      
      // Không đóng nếu click vào panel hoặc vào button đã mở panel
      if (panelRef.current && panelRef.current.contains(target)) {
        return;
      }
      
      if (anchorElement && anchorElement.contains(target)) {
        return;
      }
      
      onClose();
    };

    // Sử dụng setTimeout để tránh đóng ngay khi click vào button
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorElement]);

  // Tính toán vị trí panel dựa trên anchor element (desktop)
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    // Trên mobile: để CSS định vị (full width bar phía trên actions bar)
    if (deviceInfo.isMobile || deviceInfo.isPhone) {
      panelRef.current.style.top = '';
      panelRef.current.style.left = '';
      return;
    }

    if (!anchorElement) return;

    const anchorRect = anchorElement.getBoundingClientRect();
    const panelWidth = panelRef.current.offsetWidth || 300;
    const padding = 12;

    // Đặt panel phía trên icon, căn phải, chiều cao cố định 64px, nhích lên một chút
    const top = anchorRect.top - 64 - padding;
    const left = anchorRect.right - panelWidth;

    panelRef.current.style.top = `${Math.max(8, top)}px`;
    panelRef.current.style.left = `${Math.max(8, left)}px`;
  }, [isOpen, anchorElement]);

  if (!isOpen) return null;

  // Desktop: giới hạn width để chỉ hiển thị tối đa 4 icon (scroll để xem thêm)
  // Mobile: hiển thị full màn hình, scroll để xem thêm
  const isMobile = deviceInfo.isMobile || deviceInfo.isPhone;

  return (
    <Styled.Panel ref={panelRef} $isMobile={isMobile}>
      <Styled.Content>
        {allPrivateChats.length === 0 ? (
          <Styled.EmptyState>
            {intl.formatMessage(intlMessages.noNewMessages)}
          </Styled.EmptyState>
        ) : (
          <Styled.ChatList $isMobile={isMobile}>
            {allPrivateChats.map((chat) => {
              const participantColor = chat.participant?.color;
              const avatarColor = participantColor 
                ? (participantColor.startsWith('#') ? participantColor : `#${participantColor}`)
                : colorPrimary;
              
              return (
                <Styled.ChatItem
                  key={chat.chatId}
                  onClick={() => {
                    if (chat.chatId) {
                      onSelectChat(chat.chatId);
                      onClose();
                    }
                  }}
                >
                  <Styled.AvatarWrapper>
                    <Styled.Avatar
                      moderator={chat.participant?.role === window.meetingClientSettings.public.user.role_moderator}
                      avatar={chat.participant?.avatar || ''}
                      style={{ backgroundColor: avatarColor }}
                    >
                      {chat.participant?.avatar?.length === 0
                        ? chat.participant?.name?.toLowerCase().slice(0, 2) || ''
                        : ''}
                    </Styled.Avatar>
                    {((chat.totalUnread ?? 0) > 0) && (
                      <Styled.UnreadBadge>
                        {(chat.totalUnread ?? 0) > 99 ? '99+' : (chat.totalUnread ?? 0)}
                      </Styled.UnreadBadge>
                    )}
                  </Styled.AvatarWrapper>
                </Styled.ChatItem>
              );
            })}
          </Styled.ChatList>
        )}
      </Styled.Content>
    </Styled.Panel>
  );
};

export default PrivateChatNotificationPanel;
