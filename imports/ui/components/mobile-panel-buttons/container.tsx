import React, { useState, useEffect, useMemo } from 'react';
import MobilePanelButtons from './component';
import MobileDrawer from '../mobile-drawer/component';
import UserListContainer from '../user-list/container';
import ChatContainer from '../chat/chat-graphql/component';
import NotesContainer from '../notes/component';
import PrivateChatModal from '../actions-bar/private-chat-modal/component';
import { layoutSelectInput, layoutSelectOutput, layoutDispatch } from '../layout/context';
import { ACTIONS, PANELS } from '../layout/enums';
import Styled from '../actions-bar/styles';
import deviceInfo from '/imports/utils/deviceInfo';
import useChat from '/imports/ui/core/hooks/useChat';
import { GraphqlDataHookSubscriptionResponse } from '/imports/ui/Types/hook';
import { Chat } from '/imports/ui/Types/chat';

const MobilePanelButtonsContainer: React.FC = () => {
  const [isUserListDrawerOpen, setIsUserListDrawerOpen] = useState(false);
  const [isChatNotesDrawerOpen, setIsChatNotesDrawerOpen] = useState(false);
  const [isPrivateChatModalOpen, setIsPrivateChatModalOpen] = useState(false);
  
  const sidebarContent = layoutSelectInput((i) => i.sidebarContent);
  const actionBarOutput = layoutSelectOutput((i) => i.actionBar);
  const layoutContextDispatch = layoutDispatch();
  const activeChatNotesPanel = sidebarContent?.sidebarContentPanel || PANELS.CHAT;

  // Lấy danh sách các chat để tính tổng unread private
  const { data: chats } = useChat((chat) => ({
    chatId: chat.chatId,
    totalUnread: chat.totalUnread,
  })) as GraphqlDataHookSubscriptionResponse<Partial<Chat>[]>;

  // Tính tổng số tin nhắn private chưa đọc
  const privateUnreadCount = useMemo(() => {
    if (!chats) return 0;
    const CHAT_CONFIG = window.meetingClientSettings.public.chat;
    const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
    return chats
      .filter((c) => c.chatId && c.chatId !== PUBLIC_GROUP_CHAT_ID)
      .reduce((sum, c) => sum + (c.totalUnread || 0), 0);
  }, [chats]);

  // Set CSS variable for actionBar height
  useEffect(() => {
    if (deviceInfo.isMobile && actionBarOutput?.height) {
      document.documentElement.style.setProperty('--actionbar-height', `${actionBarOutput.height}px`);
    }
  }, [actionBarOutput?.height]);

  // Listen for external private chat modal open event
  useEffect(() => {
    const handleExternalOpenPrivateChat = (e: CustomEvent) => {
      setIsPrivateChatModalOpen(true);
    };
    window.addEventListener('openPrivateChatModal', handleExternalOpenPrivateChat as EventListener);
    return () => {
      window.removeEventListener('openPrivateChatModal', handleExternalOpenPrivateChat as EventListener);
    };
  }, []);

  return (
    <>
      <MobilePanelButtons
        onToggleUserList={() => setIsUserListDrawerOpen((prev) => !prev)}
        onToggleChatNotes={() => setIsChatNotesDrawerOpen((prev) => !prev)}
        onTogglePrivateChat={() => setIsPrivateChatModalOpen((prev) => !prev)}
        privateUnreadCount={privateUnreadCount}
      />
      
      <MobileDrawer
        isOpen={isUserListDrawerOpen}
        onClose={() => setIsUserListDrawerOpen(false)}
        position="left"
        title="Users"
      >
        <UserListContainer />
      </MobileDrawer>
      
      <MobileDrawer
        isOpen={isChatNotesDrawerOpen}
        onClose={() => setIsChatNotesDrawerOpen(false)}
        position="right"
        title="Chat & Notes"
      >
        <Styled.ChatNotesTabs>
          <Styled.TabButton
            type="button"
            onClick={() => {
              layoutContextDispatch({
                type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
                value: PANELS.CHAT,
              });
            }}
            data-active={activeChatNotesPanel === PANELS.CHAT}
          >
            Chat
          </Styled.TabButton>
          <Styled.TabButton
            type="button"
            onClick={() => {
              layoutContextDispatch({
                type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
                value: PANELS.SHARED_NOTES,
              });
            }}
            data-active={activeChatNotesPanel === PANELS.SHARED_NOTES}
          >
            Notes
          </Styled.TabButton>
        </Styled.ChatNotesTabs>
        {activeChatNotesPanel === PANELS.CHAT && (
          <ChatContainer mode="sidebar" />
        )}
        {activeChatNotesPanel === PANELS.SHARED_NOTES && (
          <NotesContainer isToSharedNotesBeShow={true} />
        )}
      </MobileDrawer>
      <PrivateChatModal
        isOpen={isPrivateChatModalOpen}
        onRequestClose={() => setIsPrivateChatModalOpen(false)}
      />
    </>
  );
};

export default MobilePanelButtonsContainer;

