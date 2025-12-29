import React, { useRef } from 'react';
import { CircularProgress } from '@mui/material';
import ChatHeader from './chat-header/component';
import { layoutSelect, layoutSelectInput } from '../../layout/context';
import { Input, Layout } from '../../layout/layoutTypes';
import Styled from './styles';
import ChatMessageListContainer from './chat-message-list/component';
import ChatMessageFormContainer from './chat-message-form/component';
import ChatTypingIndicatorContainer from './chat-typing-indicator/component';
import { PANELS, ACTIONS } from '/imports/ui/components/layout/enums';
import usePendingChat from '/imports/ui/core/local-states/usePendingChat';
import useChat from '/imports/ui/core/hooks/useChat';
import { Chat as ChatType } from '/imports/ui/Types/chat';
import { layoutDispatch } from '/imports/ui/components/layout/context';
import browserInfo from '/imports/utils/browserInfo';
import { GraphqlDataHookSubscriptionResponse } from '/imports/ui/Types/hook';
import useCurrentUser from '/imports/ui/core/hooks/useCurrentUser';
import { ChatEvents } from '/imports/ui/core/enums/chat';

interface ChatProps {
  isRTL: boolean;
  mode?: 'sidebar' | 'modal';
  chatId: string;
}

const Chat: React.FC<ChatProps> = ({ isRTL, mode = 'sidebar', chatId }) => {
  const { isChrome } = browserInfo;
  const isEditingMessage = useRef(false);

  React.useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (window.getSelection && e.button !== 2) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditingMessage.current) {
        window.dispatchEvent(
          new CustomEvent(ChatEvents.CHAT_CANCEL_EDIT_REQUEST),
        );
      }
    };

    const handleEditingMessage = (e: Event) => {
      if (e instanceof CustomEvent) {
        isEditingMessage.current = true;
      }
    };

    const handleCancelEditingMessage = (e: Event) => {
      if (e instanceof CustomEvent) {
        isEditingMessage.current = false;
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener(ChatEvents.CHAT_EDIT_REQUEST, handleEditingMessage);
    window.addEventListener(ChatEvents.CHAT_CANCEL_EDIT_REQUEST, handleCancelEditingMessage);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(ChatEvents.CHAT_EDIT_REQUEST, handleEditingMessage);
      window.removeEventListener(ChatEvents.CHAT_CANCEL_EDIT_REQUEST, handleCancelEditingMessage);
    };
  }, []);

  return (
    <Styled.Chat isRTL={isRTL} isChrome={isChrome} mode={mode}>
      <ChatHeader mode={mode} chatId={chatId} />
      <ChatMessageListContainer chatId={chatId} mode={mode} />
      <ChatMessageFormContainer chatId={chatId} mode={mode} />
      <ChatTypingIndicatorContainer chatId={chatId} />
    </Styled.Chat>
  );
};
export const ChatLoading: React.FC<ChatProps> = ({ isRTL }) => {
  const { isChrome } = browserInfo;
  return (
    <Styled.Chat isRTL={isRTL} isChrome={isChrome}>
      <CircularProgress style={{ alignSelf: 'center' }} />
    </Styled.Chat>
  );
};

interface ChatContainerProps {
  // 'sidebar' dùng cho panel dưới; 'modal' dùng cho popup private chat
  mode?: 'sidebar' | 'modal';
  // Optional: override chatId để tách biệt với idChatOpen từ layout context
  // Khi được truyền, component sẽ dùng chatId này thay vì idChatOpen
  chatId?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ mode = 'sidebar', chatId: overrideChatId }) => {
  const idChatOpenFromLayout = layoutSelect((i: Layout) => i.idChatOpen);
  const isRTL = layoutSelect((i: Layout) => i.isRTL);
  const sidebarContent = layoutSelectInput((i: Input) => i.sidebarContent);
  const layoutContextDispatch = layoutDispatch();
  
  // Trong sidebar mode, nếu không có idChatOpen, tự động set về public chat
  const CHAT_CONFIG = window.meetingClientSettings.public.chat;
  const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
  
  // Sử dụng overrideChatId nếu có, nếu không thì dùng idChatOpen từ layout
  let idChatOpen = overrideChatId ?? idChatOpenFromLayout;
  
  // Trong sidebar mode, nếu không có idChatOpen và activePanel là CHAT, set về public chat
  React.useEffect(() => {
    if (mode === 'sidebar' && !idChatOpen && sidebarContent.sidebarContentPanel === PANELS.CHAT) {
      layoutContextDispatch({
        type: ACTIONS.SET_ID_CHAT_OPEN,
        value: PUBLIC_GROUP_CHAT_ID,
      });
      idChatOpen = PUBLIC_GROUP_CHAT_ID;
    }
  }, [mode, idChatOpen, sidebarContent.sidebarContentPanel, layoutContextDispatch]);
  
  // Update idChatOpen sau khi set trong useEffect
  const finalIdChatOpen = overrideChatId ?? idChatOpenFromLayout ?? (mode === 'sidebar' && sidebarContent.sidebarContentPanel === PANELS.CHAT ? PUBLIC_GROUP_CHAT_ID : idChatOpenFromLayout);
  const { data: chats } = useChat((chat) => {
    return {
      chatId: chat.chatId,
      participant: chat.participant,
    };
  }) as GraphqlDataHookSubscriptionResponse<Partial<ChatType>[]>;

  const [pendingChat, setPendingChat] = usePendingChat();

  const { data: currentUser } = useCurrentUser((c) => ({
    userLockSettings: c?.userLockSettings,
    locked: c?.locked,
  }));

  const isLocked = currentUser?.locked || currentUser?.userLockSettings?.disablePublicChat;

  // Giữ lại pendingChat cho các flow cũ, nhưng không được dispatch layout trong quá trình render.
  // Chỉ xử lý pendingChat nếu không có overrideChatId (để tránh conflict)
  React.useEffect(() => {
    if (overrideChatId || !pendingChat || !chats) return;
    const chat = chats.find((c) => {
      return c.participant?.userId === pendingChat;
    });
    if (chat) {
      setPendingChat('');
      layoutContextDispatch({
        type: ACTIONS.SET_ID_CHAT_OPEN,
        value: chat.chatId,
      });
    }
  }, [overrideChatId, pendingChat, chats, layoutContextDispatch, setPendingChat]);

  // Trong sidebar mode, luôn render chat nếu activePanel là CHAT (đã được check ở parent)
  // Không cần check sidebarContentPanel nữa vì parent đã đảm bảo activePanel === PANELS.CHAT
  // Sử dụng finalIdChatOpen nếu có, fallback về PUBLIC_GROUP_CHAT_ID trong sidebar mode
  const chatIdToUse = finalIdChatOpen || (mode === 'sidebar' && sidebarContent.sidebarContentPanel === PANELS.CHAT ? PUBLIC_GROUP_CHAT_ID : idChatOpen);
  if (!chatIdToUse && !isLocked) return <ChatLoading isRTL={isRTL} chatId="" />;
  return <Chat isRTL={isRTL} mode={mode} chatId={chatIdToUse} />;
};

export default ChatContainer;
