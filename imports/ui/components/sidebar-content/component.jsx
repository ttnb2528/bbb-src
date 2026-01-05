import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Resizable } from 're-resizable';
import { ACTIONS, PANELS } from '../layout/enums';
import { layoutSelectInput, layoutDispatch, layoutSelect } from '../layout/context';
import ChatContainer from '/imports/ui/components/chat/chat-graphql/component';
import usePendingChat from '/imports/ui/core/local-states/usePendingChat';
import PollContainer from '/imports/ui/components/poll/container';
import BreakoutRoomContainer from '../breakout-room/breakout-room/component';
import TimerContainer from '/imports/ui/components/timer/panel/component';
import GuestUsersManagementPanel from '/imports/ui/components/waiting-users/waiting-users-graphql/component';
import Styled from './styles';
import ErrorBoundary from '/imports/ui/components/common/error-boundary/component';
import FallbackView from '/imports/ui/components/common/fallback-errors/fallback-view/component';
import GenericContentSidekickContainer from '/imports/ui/components/generic-content/generic-sidekick-content/container';
import deviceInfo from '/imports/utils/deviceInfo';
// Import user list components
import UserListParticipantsContainer from '../user-list/user-list-content/user-participants/user-list-participants/component';
import UserTitleContainer from '../user-list/user-list-graphql/user-participants-title/component';
import GuestPanelOpenerContainer from '../user-list/user-list-graphql/user-participants-title/guest-panel-opener/component';
import GuestWaitingNotification from '../sidebar-navigation/guest-waiting-notification/component';

const propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number,
  right: PropTypes.number,
  zIndex: PropTypes.number.isRequired,
  minWidth: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  maxWidth: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  isResizable: PropTypes.bool.isRequired,
  resizableEdge: PropTypes.objectOf(PropTypes.bool).isRequired,
  contextDispatch: PropTypes.func.isRequired,
};

const SidebarContent = (props) => {
  const {
    top,
    left = null,
    right = null,
    zIndex,
    minWidth,
    width,
    maxWidth,
    minHeight,
    height,
    maxHeight,
    isResizable,
    resizableEdge,
    contextDispatch,
    sidebarContentPanel,
    amIPresenter,
    isSharedNotesPinned,
    currentSlideId,
    amIModerator,
    isOpen = false,
  } = props;

  const [resizableWidth, setResizableWidth] = useState(width);
  const [resizableHeight, setResizableHeight] = useState(height);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);

  const COLLAPSED_HEIGHT = 52;
  const [isCollapsed, setIsCollapsed] = useState(height <= COLLAPSED_HEIGHT + 4);

  // Fallback: nếu panel bị set về NONE (khi bấm nút back trong header chat),
  // ta vẫn giữ CHÁT làm mặc định để không bị mất panel
  let activePanel = sidebarContentPanel;
  if (!activePanel || activePanel === PANELS.NONE) {
    activePanel = PANELS.CHAT; // default
  }

  useEffect(() => {
    if (!isResizing) {
      setResizableWidth(width);
      setResizableHeight(height);
      setIsCollapsed(height <= COLLAPSED_HEIGHT + 4);
    }
  }, [width, height]);

  const setSidebarContentSize = (dWidth, dHeight) => {
    const newWidth = resizeStartWidth + dWidth;
    const newHeight = resizeStartHeight + dHeight;

    setResizableWidth(newWidth);
    setResizableHeight(newHeight);

    contextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_SIZE,
      value: {
        width: newWidth,
        height: newHeight,
        browserWidth: window.innerWidth,
        browserHeight: window.innerHeight,
      },
    });
  };

  const smallSidebar = width < (maxWidth / 2);
  const pollDisplay = sidebarContentPanel === PANELS.POLL ? 'inherit' : 'none';

  // Luôn ép mở Public Chat khi ở panel CHÁT để tránh mở private chat trong panel ngang
  // Force set public chat ID mỗi khi component render và ở tab CHAT
  // Điều này đảm bảo sidebar-content luôn hiển thị public chat, ngay cả khi private modal thay đổi idChatOpen
  const idChatOpen = layoutSelect((i) => i.idChatOpen);
  const [pendingChat, setPendingChat] = usePendingChat();
  
  // Clear pendingChat khi sidebar-content đang mở để tránh conflict với private modal
  // Khi user click "Start Private Chat" từ user list, pendingChat sẽ được set
  // Nhưng sidebar-content không nên xử lý nó, để private modal xử lý thay
  useEffect(() => {
    if (activePanel === PANELS.CHAT && pendingChat) {
      // Clear pendingChat để không trigger logic trong ChatContainer
      // Private modal sẽ xử lý pendingChat riêng
      setPendingChat('');
    }
  }, [activePanel, pendingChat, setPendingChat]);
  
  useEffect(() => {
    const CHAT_CONFIG = window.meetingClientSettings.public.chat;
    const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
    if (activePanel === PANELS.CHAT) {
      // Chỉ set khi idChatOpen không phải là public chat để tránh set không cần thiết
      // Điều này đảm bảo sidebar-content luôn hiển thị public chat, ngay cả khi private modal thay đổi idChatOpen
      if (idChatOpen !== PUBLIC_GROUP_CHAT_ID) {
        contextDispatch({
          type: ACTIONS.SET_ID_CHAT_OPEN,
          value: PUBLIC_GROUP_CHAT_ID,
        });
      }
    }
  }, [activePanel, idChatOpen, contextDispatch]);

  const handleSelectPanel = (panel) => {
    contextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
      value: panel,
    });
  };

  // Không dùng tab nữa, chỉ dùng panel được set từ actions-bar

  const expandedHeight = Math.min(Math.max(minHeight * 2, 260), maxHeight || window.innerHeight * 0.5);
  
  // Tính toán translateX để panel trượt từ bên phải vào
  // Dùng isOpen để control ẩn/hiện: khi isOpen = false → ẩn ra ngoài (translateX = 100%)
  // Khi isOpen = true → hiển thị (translateX = 0)
  const translateXOffset = isOpen ? '0' : '100%';

  const toggleCollapsed = () => {
    // Toggle isOpen state để ẩn/hiện sidebar
    contextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
      value: !isOpen,
    });
  };

  return (
    <Resizable
      minWidth={minWidth}
      maxWidth={maxWidth}
      minHeight={minHeight}
      maxHeight={maxHeight}
      size={{
        width,
        height: resizableHeight,
      }}
      enable={{
        top: isResizable && resizableEdge.top,
        left: isResizable && resizableEdge.left,
        bottom: isResizable && resizableEdge.bottom,
        right: isResizable && resizableEdge.right,
      }}
      handleWrapperClass="resizeSidebarContentWrapper"
      onResizeStart={() => {
        setIsResizing(true);
        setResizeStartWidth(resizableWidth);
        setResizeStartHeight(resizableHeight);
      }}
      onResize={(...[, , , delta]) => setSidebarContentSize(delta.width, delta.height)}
      onResizeStop={() => {
        setIsResizing(false);
        setResizeStartWidth(0);
        setResizeStartHeight(0);
      }}
      style={{
        position: 'absolute',
        top,
        left,
        right,
        zIndex,
        width,
        height: resizableHeight,
        // Animation mượt mà cho trượt ngang từ bên phải
        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        willChange: 'transform, height',
        transform: `translateX(${translateXOffset})`,
      }}
      handleStyles={{
        left: {
          width: '4px',
          height: '100vh',
          left: '-2px',
          cursor: 'ew-resize',
        },
        right: {
          width: '12px',
          height: '100vh',
          right: '-12px',
          cursor: 'ew-resize',
        },
      }}
    >
      <Styled.SidebarContentWrapper>
        {/* Thanh handle ở mép trái để kéo panel ra/vào - Ẩn trên mobile */}
        {!deviceInfo.isPhone && (
          <Styled.SideHandle type="button" onClick={toggleCollapsed} data-collapsed={!isOpen}>
            <i className="icon-bbb-chat" />
          </Styled.SideHandle>
        )}

        <Styled.ContentArea>
          {/* Tab People - User List */}
          {activePanel === PANELS.USERLIST && (
            <ErrorBoundary fallbackComponent={() => <FallbackView />} from="sidebar-content-userlist">
              <UserTitleContainer />
              <GuestPanelOpenerContainer />
              <GuestWaitingNotification />
              <UserListParticipantsContainer />
            </ErrorBoundary>
          )}
          
          {/* Tab Chat */}
          {activePanel === PANELS.CHAT && (
            <ErrorBoundary fallbackComponent={() => <FallbackView />} from="sidebar-content">
              <ChatContainer mode="sidebar" />
            </ErrorBoundary>
          )}
          
          {/* Các panel khác (POLL, TIMER, etc.) */}
          {activePanel === PANELS.BREAKOUT && <BreakoutRoomContainer />}
          {activePanel === PANELS.TIMER && <TimerContainer isModerator={amIModerator} />}
          {activePanel === PANELS.WAITING_USERS && <GuestUsersManagementPanel />}
          {activePanel === PANELS.POLL && (
            <Styled.Poll
              style={{ minWidth, top: '0', display: pollDisplay }}
              id="pollPanel"
            >
              <PollContainer
                smallSidebar={smallSidebar}
                amIPresenter={amIPresenter}
                currentSlideId={currentSlideId}
              />
            </Styled.Poll>
          )}
          {activePanel.includes && activePanel.includes(PANELS.GENERIC_CONTENT_SIDEKICK) && (
            <GenericContentSidekickContainer
              genericSidekickContentId={activePanel}
            />
          )}
        </Styled.ContentArea>
      </Styled.SidebarContentWrapper>
    </Resizable>
  );
};

SidebarContent.propTypes = propTypes;
export default SidebarContent;
