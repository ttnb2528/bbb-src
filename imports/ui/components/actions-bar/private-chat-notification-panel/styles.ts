import styled from 'styled-components';
import {
  colorWhite,
  colorGrayLight,
  colorGrayDark,
  colorDanger,
  colorPrimary,
} from '/imports/ui/stylesheets/styled-components/palette';
import { smPaddingX, smPaddingY, borderSize, borderRadius } from '/imports/ui/stylesheets/styled-components/general';
import { fontSizeBase, fontSizeSmall } from '/imports/ui/stylesheets/styled-components/typography';
import { smallOnly } from '/imports/ui/stylesheets/styled-components/breakpoints';

const Panel = styled.div<{ $isMobile?: boolean }>`
  position: fixed;
  background-color: ${colorWhite};
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 1001;
  padding: 0px 8px;
  height: 64px;
  display: flex;
  align-items: center;
  min-width: 200px;
  
  /* Desktop: giới hạn width để chỉ hiển thị tối đa 4 icon 
     * Tính toán: 4 icon (4 * 44px = 176px) + 3 gap (3 * 10px = 30px) + padding (16px) = 222px
     * Thêm một chút để scrollbar có thể hiển thị = 234px
     * Dùng fit-content để panel tự co lại nếu ít icon hơn, nhưng không vượt quá 234px
     */
  ${({ $isMobile }) => !$isMobile && `
    width: fit-content;
    max-width: 234px;
  `}

  /* Mobile: full width bar phía trên actions bar */
  @media ${smallOnly} {
    left: 50%;
    transform: translateX(-50%);
    right: auto;
    bottom: 80px;
    top: auto;
    width: calc(100% - 32px);
    max-width: 480px;
  }
`;

const Content = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
`;

const EmptyState = styled.div`
  padding: 0 16px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colorGrayDark};
  font-size: ${fontSizeBase};
  white-space: nowrap;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 22px;
`;

const ChatList = styled.div<{ $isMobile?: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: ${colorGrayLight} transparent;
  height: 100%;
  align-items: center;
  width: 100%;
  
  /* Desktop: chỉ hiển thị scrollbar khi có nhiều hơn 4 icon */
  ${({ $isMobile }) => !$isMobile && `
    /* Smooth scroll */
    scroll-behavior: smooth;
  `}
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${colorGrayLight};
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: ${colorGrayDark};
  }
`;

const ChatItem = styled.div`
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
  height: 44px;
  display: flex;
  align-items: center;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(1.0);
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 44px;
  width: 44px;
`;

const Avatar = styled.div<{ moderator?: boolean; avatar?: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colorWhite};
  font-weight: 600;
  font-size: 15px;
  flex-shrink: 0;
  ${({ moderator }) => moderator && `
    border: 2px solid ${colorPrimary};
  `}
  ${({ avatar }) => avatar && avatar.length > 0 && `
    background-image: url(${avatar});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  `}
`;

const UnreadBadge = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: ${colorDanger};
  color: ${colorWhite};
  border-radius: 9px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  border: 2px solid ${colorWhite};
  z-index: 10;
`;

export default {
  Panel,
  Content,
  EmptyState,
  ChatList,
  ChatItem,
  AvatarWrapper,
  Avatar,
  UnreadBadge,
};
