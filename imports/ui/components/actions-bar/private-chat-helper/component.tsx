import React, { useEffect, useRef } from 'react';
import useChat from '/imports/ui/core/hooks/useChat';
import { Chat } from '/imports/ui/Types/chat';
import { GraphqlDataHookSubscriptionResponse } from '/imports/ui/Types/hook';

interface PrivateChatHelperProps {
  // Không cần props nữa vì sử dụng event system
}

/**
 * Helper component để query chats và tìm chatId từ userId
 * Vì actions-bar là class component, không thể dùng hooks trực tiếp
 */
const PrivateChatHelper: React.FC<PrivateChatHelperProps> = () => {
  const { data: chats } = useChat((chat) => ({
    chatId: chat.chatId,
    participant: chat.participant,
    totalUnread: chat.totalUnread,
  })) as GraphqlDataHookSubscriptionResponse<Partial<Chat>[]>;

  // Dùng useRef để lưu retry count và chats, không bị reset mỗi lần render
  const retryCountRef = useRef<{ [userId: string]: number }>({});
  const retryTimeoutRef = useRef<{ [userId: string]: NodeJS.Timeout | null }>({});
  const chatsRef = useRef<Partial<Chat>[] | undefined>(undefined);

  // Update chats ref mỗi khi chats thay đổi
  useEffect(() => {
    chatsRef.current = chats || undefined;
  }, [chats]);

  // Setup event listener một lần khi component mount, không phụ thuộc vào chats
  useEffect(() => {
    const MAX_RETRIES = 20; // Tăng lên 2 giây (20 * 100ms) để đảm bảo chats load xong
    
    const handleFindChatIdFromUserId = (e: Event) => {
      if (!(e instanceof CustomEvent)) return;
      const { userId } = e.detail || {};
      if (!userId) return;

      // Sử dụng chatsRef để luôn có data mới nhất
      const currentChats = chatsRef.current;

      // Clear timeout trước đó nếu có
      if (retryTimeoutRef.current[userId]) {
        clearTimeout(retryTimeoutRef.current[userId]!);
        retryTimeoutRef.current[userId] = null;
      }

      // Tìm chat với userId này
      const chat = currentChats?.find((c) => c.participant?.userId === userId);
      
      // Nếu tìm thấy chat, dispatch event và reset retry count
      if (chat && chat.chatId) {
        // Reset retry count khi đã tìm thấy
        delete retryCountRef.current[userId];
        // Dispatch event với chatId để actions-bar mở modal
        window.dispatchEvent(new CustomEvent('openPrivateChatModal', {
          detail: { chatId: chat.chatId },
        }));
        return;
      }

      // Nếu không tìm thấy chat, retry với số lần giới hạn
      // (có thể chats chưa có hoặc chat với userId này chưa được tạo)
      const currentRetryCount = retryCountRef.current[userId] || 0;
      
      if (currentRetryCount < MAX_RETRIES) {
        retryCountRef.current[userId] = currentRetryCount + 1;
        retryTimeoutRef.current[userId] = setTimeout(() => {
          const retryEvent = new CustomEvent('findChatIdFromUserId', {
            detail: { userId },
          });
          window.dispatchEvent(retryEvent);
        }, 100);
      } else {
        // Reset retry count sau khi đạt max
        delete retryCountRef.current[userId];
      }
    };

    window.addEventListener('findChatIdFromUserId', handleFindChatIdFromUserId as EventListener);
    return () => {
      // Cleanup tất cả timeouts
      Object.values(retryTimeoutRef.current).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
      window.removeEventListener('findChatIdFromUserId', handleFindChatIdFromUserId as EventListener);
    };
  }, []); // Empty dependency - chỉ setup một lần khi mount

  // Note: Không cần listener cho 'openPrivateChatModal' ở đây nữa
  // vì actions-bar/component.jsx đã có handleExternalOpenPrivateChat để xử lý event này
  // Nếu thêm listener ở đây sẽ gây duplicate và mở popup 2 lần

  return null; // Component này không render gì
};

export default PrivateChatHelper;
