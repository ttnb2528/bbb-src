import React, { useEffect, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import * as Styled from './styles';
import useChat from '/imports/ui/core/hooks/useChat';
import { Chat } from '/imports/ui/Types/chat';
import { GraphqlDataHookSubscriptionResponse } from '/imports/ui/Types/hook';
import { colorPrimary } from '/imports/ui/stylesheets/styled-components/palette';

const intlMessages = defineMessages({
  privateChat: {
    id: 'app.chat.privateChat',
    description: 'Private Chat',
    defaultMessage: 'Private Chat',
  },
});

interface PrivateChatDockProps {
  isOpen: boolean;
  minimizedChats: string[]; // Array of chatIds that are minimized
  onClose: () => void;
  onSelectChat: (chatId: string, iconPosition?: { left: number; top: number }) => void;
  anchorPosition?: { left: number; top: number }; // Vị trí của icon minimized
}

const PrivateChatDock: React.FC<PrivateChatDockProps> = ({
  isOpen,
  minimizedChats,
  onClose,
  onSelectChat,
  anchorPosition,
}) => {
  const intl = useIntl();
  const dockRef = useRef<HTMLDivElement>(null);

  const { data: chats } = useChat((chat) => ({
    chatId: chat.chatId,
    participant: chat.participant,
    totalUnread: chat.totalUnread,
  })) as GraphqlDataHookSubscriptionResponse<Partial<Chat>[]>;

  // Lấy thông tin các chat minimized
  const minimizedChatData = minimizedChats
    .map((chatId) => chats?.find((c) => c.chatId === chatId))
    .filter(Boolean) as Partial<Chat>[];

  // Đóng dock khi click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        // Delay để tránh đóng ngay khi click vào icon mở dock
        setTimeout(() => {
          onClose();
        }, 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || minimizedChatData.length === 0) return null;

  // Tính toán vị trí dock: hiển thị ngang từ anchor position
  const dockStyle: React.CSSProperties = {};
  let totalWidth = 0;
  const itemWidth = 56;
  const spacing = 8;
  if (anchorPosition) {
    // Dock hiển thị ngang, từ phải sang trái
    totalWidth = minimizedChatData.length * (itemWidth + spacing) - spacing;
    dockStyle.left = `${anchorPosition.left - totalWidth - 16}px`;
    dockStyle.top = `${anchorPosition.top}px`;
  }

  return (
    <Styled.Dock ref={dockRef} style={dockStyle} $isOpen={isOpen}>
      {minimizedChatData.map((chat, index) => {
        if (!chat.chatId || !chat.participant) return null;

        const participant = chat.participant;
        const initials = participant.name
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2) || '?';
        const bgColor = participant.color 
          ? (participant.color.startsWith('#') ? participant.color : `#${participant.color}`)
          : colorPrimary;
        const unreadCount = chat.totalUnread || 0;
        // Tính toán vị trí tuyệt đối của icon trong dock để mở popup tại vị trí icon đang hiển thị
        const iconPosition = anchorPosition
          ? {
              left: (anchorPosition.left - totalWidth - 16) + index * (itemWidth + spacing),
              top: anchorPosition.top,
            }
          : undefined;

        return (
          <Styled.DockItem
            key={chat.chatId}
            onClick={() => {
              onSelectChat(chat.chatId!, iconPosition);
              onClose();
            }}
            title={participant.name || intl.formatMessage(intlMessages.privateChat)}
          >
            <Styled.Avatar bgColor={bgColor}>
              {participant.avatar && participant.avatar.length > 0 ? (
                <Styled.AvatarImage 
                  src={participant.avatar} 
                  alt={participant.name || ''} 
                />
              ) : (
                initials
              )}
            </Styled.Avatar>
            {unreadCount > 0 && (
              <Styled.UnreadBadge>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Styled.UnreadBadge>
            )}
          </Styled.DockItem>
        );
      })}
    </Styled.Dock>
  );
};

export default PrivateChatDock;
