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

  // Luôn mount trong DOM để animation hoạt động mượt mà
  // Chỉ ẩn/hiện thông qua CSS thay vì unmount
  if (minimizedChatData.length === 0) return null;

  // Tính toán vị trí dock: detect nửa màn hình để xổ đúng hướng
  const dockStyle: React.CSSProperties = {};
  let totalWidth = 0;
  const itemWidth = 48; // Giảm từ 56 xuống 48 để đẹp hơn
  const spacing = 8;
  const iconSize = 56; // Kích thước icon minimized thực tế
  let dockDirection: 'left' | 'right' = 'left'; // Mặc định xổ qua trái
  let dockLeft = 0; // Lưu giá trị số để dùng cho tính toán icon position
  
  if (anchorPosition) {
    totalWidth = minimizedChatData.length * (itemWidth + spacing) - spacing;
    const screenWidth = window.innerWidth;
    const screenPadding = 16; // Padding từ edge màn hình
    
    // Detect nửa màn hình: nếu icon ở nửa bên trái (< 50% width) thì xổ qua phải, ngược lại xổ qua trái
    const isOnLeftHalf = anchorPosition.left < screenWidth / 2;
    
    if (isOnLeftHalf) {
      // Icon ở nửa trái: dock xổ qua phải (từ icon sang phải)
      dockDirection = 'right';
      // Dock bắt đầu từ bên phải icon (anchorPosition.left + iconSize + spacing)
      const dockStartLeft = anchorPosition.left + iconSize + spacing;
      // Đảm bảo dock không tràn ra ngoài màn hình
      const maxLeft = screenWidth - totalWidth - screenPadding;
      dockLeft = Math.min(dockStartLeft, maxLeft);
      dockStyle.left = `${dockLeft}px`;
      dockStyle.top = `${anchorPosition.top}px`;
    } else {
      // Icon ở nửa phải: dock xổ qua trái (từ icon sang trái)
      dockDirection = 'left';
      // Dock bắt đầu từ bên trái icon (anchorPosition.left - totalWidth - spacing)
      const dockStartLeft = anchorPosition.left - totalWidth - spacing;
      // Đảm bảo dock không tràn ra ngoài màn hình
      const minLeft = screenPadding;
      dockLeft = Math.max(dockStartLeft, minLeft);
      dockStyle.left = `${dockLeft}px`;
      dockStyle.top = `${anchorPosition.top}px`;
    }
  }

  return (
    <Styled.Dock ref={dockRef} style={dockStyle} $isOpen={isOpen} $direction={dockDirection}>
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
        const iconPosition = anchorPosition && dockLeft > 0
          ? {
              // Vị trí icon = vị trí dock + offset của icon trong dock
              left: dockLeft + index * (itemWidth + spacing),
              top: anchorPosition.top,
            }
          : undefined;

        return (
          <Styled.DockItem
            key={chat.chatId}
            $index={minimizedChatData.indexOf(chat)}
            $isOpen={isOpen}
            $direction={dockDirection}
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
