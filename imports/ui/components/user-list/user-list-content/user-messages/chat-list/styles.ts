import styled from 'styled-components';
import {
  colorGray,
  colorGrayLighter,
  colorGrayDark,
  colorPrimary,
  userListBg,
} from '/imports/ui/stylesheets/styled-components/palette';
import {
  borderSize, smPaddingX, lgPaddingY, mdPaddingY,
} from '/imports/ui/stylesheets/styled-components/general';
import deviceInfo from '/imports/utils/deviceInfo';

const { isMobile } = deviceInfo;

const Messages = styled.div<{ variant?: 'default' | 'modal' }>`
  flex-grow: 0;
  display: flex;
  flex-flow: column;
  flex-shrink: 0;

  ${({ variant }) => !isMobile && variant !== 'modal' && `
    max-height: 30vh;
  `}
`;

const Container = styled.div<{ variant?: 'default' | 'modal' }>`
  display: flex;
  align-items: center;
  margin-bottom: ${({ variant }) => (variant === 'modal' ? smPaddingX : lgPaddingY)};
  margin-top: ${({ variant }) => (variant === 'modal' ? smPaddingX : smPaddingX)};
`;

const Separator = styled.hr`
  margin: 1rem auto;
  width: 2.2rem;
  border: 0;
  border-top: 1px solid ${colorGrayLighter};
`;

const MessagesTitle = styled.h2<{ variant?: 'default' | 'modal' }>`
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0 ${smPaddingX};
  color: ${colorGray};
  flex: 1;
  margin: 0;
  flex: 1;
  margin: 0;
`;

const ScrollableList = styled.div<{ variant?: 'default' | 'modal' }>`
  overflow-y: auto;
  max-height: ${({ variant }) => (variant === 'modal' ? '180px' : '30vh')};
  ${({ variant }) => variant !== 'modal' && `
    background: linear-gradient(${userListBg} 30%, rgba(255,255,255,0)),
      linear-gradient(rgba(255,255,255,0), ${userListBg} 70%) 0 100%,
      /* Shadows */
      radial-gradient(farthest-side at 50% 0, rgba(0,0,0,.2), rgba(0,0,0,0)),
      radial-gradient(farthest-side at 50% 100%, rgba(0,0,0,.2), rgba(0,0,0,0)) 0 100%;
  `}
  outline: none;
  
  &:hover {
    /* Visible in Windows high-contrast themes */
    outline: transparent;
    outline-style: dotted;
    outline-width: ${borderSize};
  }

  &:focus,
  &:active {
    border-radius: none;
    box-shadow: inset 0 0 1px ${colorPrimary};
    outline-style: transparent;
  }

  overflow-x: hidden;
  padding-top: 1px;
  padding-right: 1px;
`;

const List = styled.div`
  margin: 0 0 1px ${mdPaddingY};

  [dir="rtl"] & {
    margin: 0 ${mdPaddingY} 1px 0;
  }
`;

const ListTransition = styled.div`
  display: flex;
  flex-flow: column;
  padding: ${borderSize} 0 0 0;
  outline: none;
  overflow: hidden;
  flex-shrink: 1;

  &.transition-enter,
  &.transition-appear {
    opacity: 0.01;
  }

  &.transition-enter-active,
  &.transition-appear-active {
    opacity: 1;
    
    &.animationsEnabled {
      transition: all 600ms;
    }
  }

  &.transition-leave {
    opacity: 1;
  }

  &.transition-leave-active {
    opacity: 0;

    &.animationsEnabled {
      transition: all 600ms;
    }
  }
`;

// ----- Horizontal variant for modal -----

const HorizontalList = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  padding: ${smPaddingX} ${smPaddingX} ${smPaddingX};
  overflow-x: auto;
  overflow-y: hidden;
`;

const HorizontalItem = styled.button<{ 'data-active'?: boolean }>`
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const HorizontalAvatar = styled.div<{ 'data-active'?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${userListBg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: ${colorGray};
  box-shadow: ${({ 'data-active': active }) => (active ? '0 0 0 2px rgba(255, 107, 53, 0.8)' : '0 0 0 1px rgba(0,0,0,0.05)')};
`;

const HorizontalUnread = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  background: ${colorPrimary};
  color: white;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

// ----- Vertical variant for desktop modal -----

const VerticalList = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 400px;
  padding: ${smPaddingX} 0;
`;

const VerticalItem = styled.button<{ 'data-active'?: boolean }>`
  border: none;
  background: ${({ 'data-active': active }) => (active ? 'rgba(255, 107, 53, 0.08)' : 'transparent')};
  padding: ${smPaddingX} 0.5rem ${smPaddingX} 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  width: 100%;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ 'data-active': active }) => (active ? 'rgba(255, 107, 53, 0.12)' : 'rgba(0, 0, 0, 0.04)')};
  }
`;

const VerticalAvatar = styled.div<{ 'data-active'?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${userListBg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  color: ${colorGray};
  flex-shrink: 0;
  box-shadow: ${({ 'data-active': active }) => (active ? '0 0 0 2px rgba(255, 107, 53, 0.8)' : '0 0 0 1px rgba(0,0,0,0.08)')};
`;

const VerticalContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 4px;
  align-items: flex-start;
`;

const VerticalName = styled.div<{ 'data-active'?: boolean }>`
  font-weight: 600;
  font-size: 14px;
  color: ${({ 'data-active': active }) => (active ? colorPrimary : colorGrayDark)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

const VerticalPreview = styled.div`
  font-size: 12px;
  color: ${colorGray};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  line-height: 1.4;
`;

const VerticalUnread = styled.div`
  position: absolute;
  top: ${smPaddingX};
  right: ${smPaddingX};
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: ${colorPrimary};
  color: white;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  flex-shrink: 0;
`;

export default {
  Messages,
  Container,
  Separator,
  MessagesTitle,
  ScrollableList,
  List,
  ListTransition,
  HorizontalList,
  HorizontalItem,
  HorizontalAvatar,
  HorizontalUnread,
  VerticalList,
  VerticalItem,
  VerticalAvatar,
  VerticalContent,
  VerticalName,
  VerticalPreview,
  VerticalUnread,
};
