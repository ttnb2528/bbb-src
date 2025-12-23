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
  const actionBarHeight = 100;
  const handleOffset = 36;
  const viewportHeight = window.innerHeight;
  const translateYOffset = Math.max(0, viewportHeight - actionBarHeight - top + handleOffset);

  const toggleCollapsed = () => {
    const targetCollapsed = !isCollapsed;
    setIsCollapsed(targetCollapsed);

    const targetHeight = targetCollapsed ? COLLAPSED_HEIGHT : expandedHeight;

    contextDispatch({
      type: ACTIONS.SET_SIDEBAR_NAVIGATION_SIZE,
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
        transition: isCollapsed 
          ? 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), height 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0s'
          : 'height 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'height, transform',
        transform: isCollapsed ? `translateY(${translateYOffset}px)` : 'translateY(0)',
      }}
    >
      <Styled.SidebarNavigationWrapper data-collapsed={isCollapsed}>
        {/* Thanh handle ở mép dưới để kéo panel lên / xuống */}
        <Styled.BottomHandle type="button" onClick={toggleCollapsed} data-collapsed={isCollapsed}>
          <i className="icon-bbb-up_arrow" />
        </Styled.BottomHandle>

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
