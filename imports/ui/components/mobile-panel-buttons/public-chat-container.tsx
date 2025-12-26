import React, { useEffect } from 'react';
import ChatContainer from '../chat/chat-graphql/component';
import { layoutDispatch, layoutSelect } from '../layout/context';
import { ACTIONS, PANELS } from '../layout/enums';
import { layoutSelectInput } from '../layout/context';
import { Layout } from '../layout/layoutTypes';

// Wrapper component cho ChatContainer trong drawer bên trái
// Luôn force hiển thị public chat, không bị ảnh hưởng bởi private chat modal
const PublicChatContainer: React.FC = () => {
  const sidebarContent = layoutSelectInput((i: any) => i.sidebarContent);
  const layoutContextDispatch = layoutDispatch();
  const idChatOpen = layoutSelect((i: Layout) => i.idChatOpen);
  const activeChatNotesPanel = sidebarContent?.sidebarContentPanel || PANELS.CHAT;

  // Luôn force set public chat ID khi component này render và ở tab Chat
  // Chỉ set khi idChatOpen không phải là public chat để tránh set không cần thiết
  useEffect(() => {
    if (activeChatNotesPanel === PANELS.CHAT) {
      const CHAT_CONFIG = window.meetingClientSettings.public.chat;
      const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
      
      // Chỉ set khi idChatOpen không phải là public chat
      // Điều này đảm bảo drawer luôn hiển thị public chat, ngay cả khi private modal thay đổi idChatOpen
      if (idChatOpen !== PUBLIC_GROUP_CHAT_ID) {
        layoutContextDispatch({
          type: ACTIONS.SET_ID_CHAT_OPEN,
          value: PUBLIC_GROUP_CHAT_ID,
        });
      }
    }
  }, [activeChatNotesPanel, idChatOpen, layoutContextDispatch]);

  // Chỉ render khi ở tab Chat
  if (activeChatNotesPanel !== PANELS.CHAT) {
    return null;
  }

  return <ChatContainer mode="sidebar" />;
};

export default PublicChatContainer;

