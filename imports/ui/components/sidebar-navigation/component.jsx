import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Resizable } from 're-resizable';
import { ACTIONS } from '../layout/enums';
import UserListParticipantsContainer from '../user-list/user-list-content/user-participants/user-list-participants/component';
import UserTitleContainer from '../user-list/user-list-graphql/user-participants-title/component';
import Styled from './styles';

const propTypes = {
  top: PropTypes.number.isRequired,
  left: PropTypes.number,
  right: PropTypes.number,
  zIndex: PropTypes.number.isRequired,
  minWidth: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  maxWidth: PropTypes.number.isRequired,
  minHeight: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  maxHeight: PropTypes.number.isRequired,
  isResizable: PropTypes.bool.isRequired,
  resizableEdge: PropTypes.objectOf(PropTypes.bool).isRequired,
  contextDispatch: PropTypes.func.isRequired,
};

const SidebarNavigation = ({
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
  isOpen = false,
}) => {
  const [resizableWidth, setResizableWidth] = useState(width);
  const [resizableHeight, setResizableHeight] = useState(height);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);

  const COLLAPSED_HEIGHT = 52;
  const [isCollapsed, setIsCollapsed] = useState(height <= COLLAPSED_HEIGHT + 4);

  useEffect(() => {
    if (!isResizing) {
      setResizableWidth(width);
      setResizableHeight(height);
      setIsCollapsed(height <= COLLAPSED_HEIGHT + 4);
    }
  }, [width, height]);

  const setSidebarNavWidth = (dWidth) => {
    const newWidth = resizeStartWidth + dWidth;

    setResizableWidth(newWidth);

    contextDispatch({
      type: ACTIONS.SET_SIDEBAR_NAVIGATION_SIZE,
      value: {
        width: newWidth,
        browserWidth: window.innerWidth,
        browserHeight: window.innerHeight,
      },
    });
  };

  const setSidebarNavSize = (dWidth, dHeight) => {
    const newWidth = resizeStartWidth + dWidth;
    const newHeight = resizeStartHeight + dHeight;

    setResizableWidth(newWidth);
    setResizableHeight(newHeight);

    contextDispatch({
      type: ACTIONS.SET_SIDEBAR_NAVIGATION_SIZE,
      value: {
        width: newWidth,
        height: newHeight,
        browserWidth: window.innerWidth,
        browserHeight: window.innerHeight,
      },
    });
  };

  const expandedHeight = Math.min(Math.max(minHeight * 2, 260), maxHeight || window.innerHeight * 0.5);
  
  // Tính toán translateX để panel trượt từ bên trái vào
  // Dùng isOpen để control ẩn/hiện: khi isOpen = false → ẩn ra ngoài (translateX = -100%)
  // Khi isOpen = true → hiển thị (translateX = 0)
  const translateXOffset = isOpen ? '0' : '-100%';

  const toggleCollapsed = () => {
    // Toggle isOpen state để ẩn/hiện sidebar
    contextDispatch({
      type: ACTIONS.SET_SIDEBAR_NAVIGATION_IS_OPEN,
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
      handleStyles={{
        right: {
          right: '-8px',
        },
      }}
      handleWrapperClass="resizeSidebarNavWrapper"
      onResizeStart={() => {
        setIsResizing(true);
        setResizeStartWidth(resizableWidth);
        setResizeStartHeight(resizableHeight);
      }}
      onResize={(...[, , , delta]) => setSidebarNavSize(delta.width, delta.height)}
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
        // Animation mượt mà cho trượt ngang từ bên trái
        transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        willChange: 'transform, height',
        transform: `translateX(${translateXOffset})`,
      }}
    >
      <Styled.SidebarNavigationWrapper data-collapsed={isCollapsed}>
        {/* Thanh handle ở mép phải để kéo panel ra/vào */}
        <Styled.SideHandle type="button" onClick={toggleCollapsed} data-collapsed={isCollapsed}>
          <i className="icon-bbb-right_arrow" />
        </Styled.SideHandle>

        <Styled.ContentArea data-collapsed={isCollapsed}>
          <UserTitleContainer />
          <UserListParticipantsContainer />
        </Styled.ContentArea>
      </Styled.SidebarNavigationWrapper>
    </Resizable>
  );
};

SidebarNavigation.propTypes = propTypes;
export default SidebarNavigation;
