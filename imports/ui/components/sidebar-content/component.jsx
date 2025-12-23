import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Resizable } from 're-resizable';
import { ACTIONS, PANELS } from '../layout/enums';
import { layoutSelectInput, layoutDispatch } from '../layout/context';
import ChatContainer from '/imports/ui/components/chat/chat-graphql/component';
import PollContainer from '/imports/ui/components/poll/container';
import BreakoutRoomContainer from '../breakout-room/breakout-room/component';
import TimerContainer from '/imports/ui/components/timer/panel/component';
import GuestUsersManagementPanel from '/imports/ui/components/waiting-users/waiting-users-graphql/component';
import Styled from './styles';
import ErrorBoundary from '/imports/ui/components/common/error-boundary/component';
import FallbackView from '/imports/ui/components/common/fallback-errors/fallback-view/component';
import GenericContentSidekickContainer from '/imports/ui/components/generic-content/generic-sidekick-content/container';

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
    activePanel = PANELS.CHAT;
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
  useEffect(() => {
    const CHAT_CONFIG = window.meetingClientSettings.public.chat;
    const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
    if (activePanel === PANELS.CHAT) {
      contextDispatch({
        type: ACTIONS.SET_ID_CHAT_OPEN,
        value: PUBLIC_GROUP_CHAT_ID,
      });
    }
  }, [activePanel, contextDispatch]);

  const handleSelectPanel = (panel) => {
    contextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
      value: panel,
    });
  };

  const expandedHeight = Math.min(Math.max(minHeight * 2, 260), maxHeight || window.innerHeight * 0.5);
  // Tính toán khoảng cách để panel trượt xuống sát footer khi collapsed
  // Footer có chiều cao khoảng 80px (actionbar), nút handle cao 32px và ở top: -36px
  // Khi collapsed, mình muốn top của nút handle sát footer (footer top = viewportHeight - actionBarHeight)
  const actionBarHeight = 100; // Chiều cao footer/actionbar
  const handleOffset = 36; // Nút handle nhô lên 36px từ top của panel
  const viewportHeight = window.innerHeight;
  // Top của nút handle khi expanded = top - handleOffset
  // Top của nút handle khi collapsed = top - handleOffset + translateY
  // Footer top = viewportHeight - actionBarHeight
  // Khi collapsed, mình muốn: top - handleOffset + translateY = viewportHeight - actionBarHeight
  // Vậy translateY = viewportHeight - actionBarHeight - top + handleOffset
  // Nhưng cần đảm bảo translateY dương để trượt xuống
  const translateYOffset = Math.max(0, viewportHeight - actionBarHeight - top + handleOffset);

  const toggleCollapsed = () => {
    const targetCollapsed = !isCollapsed;
    setIsCollapsed(targetCollapsed);

    const targetHeight = targetCollapsed ? COLLAPSED_HEIGHT : expandedHeight;

    contextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_SIZE,
      value: {
        width,
        height: targetHeight,
        browserWidth: window.innerWidth,
        browserHeight: window.innerHeight,
      },
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
        // Transform được ưu tiên trước, sau đó mới animate height để tránh cảm giác "kéo lên rồi mới hạ xuống"
        transition: isCollapsed 
          ? 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), height 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0s'
          : 'height 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'height, transform',
        transform: isCollapsed ? `translateY(${translateYOffset}px)` : 'translateY(0)',
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
      <Styled.SidebarContentWrapper data-collapsed={isCollapsed}>
        {/* Thanh handle ở mép dưới để kéo panel lên / xuống */}
        <Styled.BottomHandle type="button" onClick={toggleCollapsed} data-collapsed={isCollapsed}>
          <i className="icon-bbb-up_arrow" />
        </Styled.BottomHandle>

        {/* Panel ngang: chỉ hiển thị Public Chat */}
        <Styled.TabBar data-collapsed={isCollapsed}>
          <Styled.TabButton
            type="button"
            onClick={() => handleSelectPanel(PANELS.CHAT)}
            data-active={activePanel === PANELS.CHAT}
          >
            Public Chat
          </Styled.TabButton>
        </Styled.TabBar>
        <Styled.ContentArea data-collapsed={isCollapsed}>
          {activePanel === PANELS.CHAT && (
            <ErrorBoundary fallbackComponent={() => <FallbackView />} from="sidebar-content">
              <ChatContainer mode="sidebar" />
          </ErrorBoundary>
        )}
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
