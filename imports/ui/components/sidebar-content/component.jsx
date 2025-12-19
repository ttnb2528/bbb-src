import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Resizable } from 're-resizable';
import { ACTIONS, PANELS } from '../layout/enums';
import { layoutSelectInput, layoutDispatch } from '../layout/context';
import ChatListContainer from '../user-list/user-list-content/user-messages/chat-list/component';
import UserNotesContainer from '../user-list/user-list-graphql/user-list-content/user-notes/component';
import ChatContainer from '/imports/ui/components/chat/chat-graphql/component';
import NotesContainer from '/imports/ui/components/notes/component';
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

  const handleSelectPanel = (panel) => {
    contextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
      value: panel,
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
        height,
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
        height,
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
        {/* Chỉ dùng panel ngang để hiển thị Shared Notes, không còn Public Chat */}
        <Styled.TabBar>
          <Styled.TabButton
            type="button"
            onClick={() => handleSelectPanel(PANELS.SHARED_NOTES)}
            data-active={activePanel === PANELS.SHARED_NOTES}
          >
            Shared Notes
          </Styled.TabButton>
        </Styled.TabBar>
        <Styled.TabNavContent>
          {/* Danh sách chat không cần hiện ở panel ngang nữa */}
          <UserNotesContainer />
        </Styled.TabNavContent>
        
        {/* Content panels: chỉ còn Shared Notes và các panel khác, không hiển thị Public/Private chat ở đây */}
        <Styled.ContentArea>
          {!isSharedNotesPinned && (
            <NotesContainer
              isToSharedNotesBeShow={activePanel === PANELS.SHARED_NOTES}
            />
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
