import React, { useState, useEffect, useMemo } from 'react';
import MobilePanelButtons from './component';
import MobileDrawer from '../mobile-drawer/component';
import UserListContainer from '../user-list/container';
import PublicChatContainer from './public-chat-container';
import NotesContainer from '../notes/component';
import PrivateChatModal from '../actions-bar/private-chat-modal/component';
import { layoutSelectInput, layoutSelectOutput, layoutDispatch, layoutSelect } from '../layout/context';
import { Layout } from '../layout/layoutTypes';
import { ACTIONS, PANELS } from '../layout/enums';
import Styled from '../actions-bar/styles';
import deviceInfo from '/imports/utils/deviceInfo';
import useChat from '/imports/ui/core/hooks/useChat';
import useCurrentUser from '/imports/ui/core/hooks/useCurrentUser';
import useMeeting from '/imports/ui/core/hooks/useMeeting';
import { useMutation } from '@apollo/client';
import { EXTERNAL_VIDEO_STOP } from '../external-video-player/mutations';
import {
  useIsExternalVideoEnabled,
  useIsPollingEnabled,
  useIsPresentationEnabled,
  useIsTimerFeatureEnabled,
} from '/imports/ui/services/features';
import connectionStatus from '/imports/ui/core/graphql/singletons/connectionStatus';
import { useReactiveVar } from '@apollo/client';
import { useMeetingLayoutUpdater, usePushLayoutUpdater } from '../layout/push-layout/hooks';
import useSettings from '/imports/ui/services/settings/hooks/useSettings';
import { SETTINGS } from '/imports/ui/services/settings/enums';
import { GraphqlDataHookSubscriptionResponse } from '/imports/ui/Types/hook';
import { Chat } from '/imports/ui/Types/chat';

const MobilePanelButtonsContainer: React.FC = () => {
  const [isUserListDrawerOpen, setIsUserListDrawerOpen] = useState(false);
  const [isChatNotesDrawerOpen, setIsChatNotesDrawerOpen] = useState(false);
  const [isPrivateChatModalOpen, setIsPrivateChatModalOpen] = useState(false);
  
  const sidebarContent = layoutSelectInput((i: any) => i.sidebarContent);
  const actionBarOutput = layoutSelectOutput((i: any) => i.actionBar);
  const layoutContextDispatch = layoutDispatch();
  const activeChatNotesPanel = sidebarContent?.sidebarContentPanel || PANELS.CHAT;
  const idChatOpen = layoutSelect((i: Layout) => i.idChatOpen);

  // Lấy thông tin user và meeting để truyền vào ActionsDropdown
  const { data: currentUserData } = useCurrentUser((user) => ({
    presenter: user.presenter,
    isModerator: user.isModerator,
  }));
  const amIPresenter = currentUserData?.presenter;
  const amIModerator = currentUserData?.isModerator;

  const { data: currentMeeting } = useMeeting((m) => ({
    externalVideo: m.externalVideo,
    componentsFlags: m.componentsFlags,
  }));
  const isSharingVideo = !!currentMeeting?.externalVideo?.externalVideoUrl;
  const hasCameraAsContent = currentMeeting?.componentsFlags?.hasCameraAsContent;
  const isTimerActive = currentMeeting?.componentsFlags?.hasTimer;

  const [stopExternalVideoShare] = useMutation(EXTERNAL_VIDEO_STOP);
  const allowExternalVideo = useIsExternalVideoEnabled();
  const isPresentationEnabled = useIsPresentationEnabled();
  const isPollingEnabled = useIsPollingEnabled() && isPresentationEnabled;
  const isTimerFeatureEnabled = useIsTimerFeatureEnabled();
  const connected = useReactiveVar(connectionStatus.getConnectedStatusVar());
  const isMeteorConnected = connected;

  const applicationSettings = useSettings(SETTINGS.APPLICATION) as { pushLayout?: boolean; selectedLayout?: string };
  const { pushLayout } = applicationSettings || {};
  const setPushLayout = usePushLayoutUpdater(pushLayout ?? false);
  const cameraDockOutput = layoutSelectOutput((i: any) => i.cameraDock);
  const cameraDockInput = layoutSelectInput((i: any) => i.cameraDock);
  const presentationInput = layoutSelectInput((i: any) => i.presentation);
  const setMeetingLayout = useMeetingLayoutUpdater(
    cameraDockOutput,
    cameraDockInput,
    presentationInput,
    applicationSettings as any,
  );
  const LAYOUT_CONFIG = window.meetingClientSettings.public.layout;
  const { showPushLayoutButton } = LAYOUT_CONFIG;
  const showPushLayout = showPushLayoutButton && applicationSettings?.selectedLayout === 'custom';

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
    const handleExternalOpenPrivateChat = () => {
      // Chỉ mở modal nếu đang ở mobile (desktop sẽ được xử lý bởi actions-bar)
      if (deviceInfo.isMobile) {
        setIsPrivateChatModalOpen(true);
      }
    };
    window.addEventListener('openPrivateChatModal', handleExternalOpenPrivateChat as EventListener);
    return () => {
      window.removeEventListener('openPrivateChatModal', handleExternalOpenPrivateChat as EventListener);
    };
  }, []);

  // Logic force set public chat đã được chuyển sang PublicChatContainer
  // Giữ lại logic này để đảm bảo khi mở drawer, set ngay public chat ID
  useEffect(() => {
    if (isChatNotesDrawerOpen && activeChatNotesPanel === PANELS.CHAT) {
      const CHAT_CONFIG = window.meetingClientSettings.public.chat;
      const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
      
      // Set public chat ID ngay khi drawer mở để tránh loading
      layoutContextDispatch({
        type: ACTIONS.SET_ID_CHAT_OPEN,
        value: PUBLIC_GROUP_CHAT_ID,
      });
    }
  }, [isChatNotesDrawerOpen, activeChatNotesPanel, layoutContextDispatch]);

  return (
    <>
      <MobilePanelButtons
        onToggleUserList={() => setIsUserListDrawerOpen((prev) => !prev)}
        onToggleChatNotes={() => {
          const willOpen = !isChatNotesDrawerOpen;
          setIsChatNotesDrawerOpen(willOpen);
          
          // Khi mở drawer, ngay lập tức set public chat ID và panel
          if (willOpen && !isPrivateChatModalOpen) {
            const CHAT_CONFIG = window.meetingClientSettings.public.chat;
            const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
            // Set cả panel và chat ID cùng lúc
            layoutContextDispatch({
              type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
              value: PANELS.CHAT,
            });
            layoutContextDispatch({
              type: ACTIONS.SET_ID_CHAT_OPEN,
              value: PUBLIC_GROUP_CHAT_ID,
            });
          }
        }}
        onTogglePrivateChat={() => {
          if (isPrivateChatModalOpen) {
            // Nếu modal đã mở, dispatch event để expand nếu đang minimized hoặc đóng nếu không
            window.dispatchEvent(new CustomEvent('togglePrivateChatModal'));
          } else {
            // Nếu modal chưa mở, mở nó
            setIsPrivateChatModalOpen(true);
          }
        }}
        privateUnreadCount={privateUnreadCount}
        // Props cho ActionsDropdown - chỉ hiển thị khi là presenter
        amIPresenter={amIPresenter}
        amIModerator={amIModerator}
        isMeteorConnected={isMeteorConnected}
        isSharingVideo={isSharingVideo}
        isPollingEnabled={isPollingEnabled}
        isTimerActive={isTimerActive}
        isTimerEnabled={isTimerFeatureEnabled}
        allowExternalVideo={allowExternalVideo}
        stopExternalVideoShare={stopExternalVideoShare}
        hasCameraAsContent={hasCameraAsContent}
        setMeetingLayout={setMeetingLayout}
        setPushLayout={setPushLayout}
        showPushLayout={showPushLayout}
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
        onClose={() => {
          // Chỉ đóng drawer, không reset các state khác để tránh conflict
          setIsChatNotesDrawerOpen(false);
        }}
        position="right"
        title="Chat"
      >
        <Styled.ChatNotesTabs>
          <Styled.TabButton
            type="button"
            onClick={() => {
              const CHAT_CONFIG = window.meetingClientSettings.public.chat;
              const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
              layoutContextDispatch({
                type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
                value: PANELS.CHAT,
              });
              // Force set idChatOpen thành public chat ID khi click vào tab Chat
              layoutContextDispatch({
                type: ACTIONS.SET_ID_CHAT_OPEN,
                value: PUBLIC_GROUP_CHAT_ID,
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
          <PublicChatContainer />
        )}
        {activeChatNotesPanel === PANELS.SHARED_NOTES && (
          <NotesContainer isToSharedNotesBeShow={true} />
        )}
      </MobileDrawer>
      <PrivateChatModal
        isOpen={isPrivateChatModalOpen}
        onRequestClose={() => {
          // Đóng modal trực tiếp, không toggle
          setIsPrivateChatModalOpen(false);
        }}
        isPublicChatDrawerOpen={isChatNotesDrawerOpen && activeChatNotesPanel === PANELS.CHAT}
      />
    </>
  );
};

export default MobilePanelButtonsContainer;
