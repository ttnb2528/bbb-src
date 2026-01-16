import styled from 'styled-components';
import {
  colorWhite,
  colorGrayLight,
  colorGrayLightest,
  colorGrayDark,
  colorPrimary,
  colorDanger,
} from '/imports/ui/stylesheets/styled-components/palette';
import {
  smPaddingY,
  xsPadding,
  borderRadius,
} from '/imports/ui/stylesheets/styled-components/general';
import { fontSizeSmaller } from '/imports/ui/stylesheets/styled-components/typography';

export const Sidebar = styled.div`
  width: 80px;
  min-width: 80px;
  max-width: 80px;
  background-color: ${colorWhite};
  border-left: 1px solid ${colorGrayLightest};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
`;

export const Header = styled.div`
  padding: ${smPaddingY} ${xsPadding};
  border-bottom: 1px solid ${colorGrayLightest};
  background-color: ${colorWhite};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
`;

export const HeaderTitle = styled.span`
  font-size: 0.6875rem;
  font-weight: 600;
  color: ${colorGrayDark};
  text-align: center;
  white-space: normal;
  letter-spacing: 0.2px;
  line-height: 1.3;
  word-break: break-word;
  padding: 0 4px;
`;

export const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${xsPadding} 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${xsPadding};
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${colorGrayLight};
    border-radius: 2px;
    
    &:hover {
      background: ${colorGrayDark};
    }
  }
`;

export const ChatItem = styled.button<{ $hasUnread: boolean }>`
  position: relative;
  width: 48px;
  height: 48px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  border-radius: ${borderRadius};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${colorGrayLightest};
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:focus {
    outline: 2px solid ${colorPrimary};
    outline-offset: 2px;
  }
  
  ${({ $hasUnread }) => $hasUnread && `
    /* Highlight khi có unread messages */
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 24px;
      background-color: ${colorPrimary};
      border-radius: 0 2px 2px 0;
    }
  `}
`;

export const AvatarWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface AvatarProps {
  avatar: string;
  moderator: boolean;
}

export const Avatar = styled.div<AvatarProps>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${colorWhite};
  text-transform: uppercase;
  border: 2px solid ${colorWhite};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  
  ${({ avatar }) => avatar && avatar.length > 0 && `
    background-image: url(${avatar});
  `}
  
  ${({ moderator }) => moderator && `
    border-color: ${colorPrimary};
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15), 0 0 0 2px ${colorPrimary}20;
  `}
  
  ${ChatItem}:hover & {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

export const UnreadBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background-color: ${colorDanger};
  color: ${colorWhite};
  border-radius: 9px;
  font-size: 0.625rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colorWhite};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
  line-height: 1;
`;

export const EmptyState = styled.div`
  padding: ${smPaddingY} ${xsPadding};
  text-align: center;
  color: ${colorGrayDark};
  font-size: ${fontSizeSmaller};
  font-style: italic;
  line-height: 1.4;
`;

export default {
  Sidebar,
  Header,
  HeaderTitle,
  ChatList,
  ChatItem,
  AvatarWrapper,
  Avatar,
  UnreadBadge,
  EmptyState,
};
