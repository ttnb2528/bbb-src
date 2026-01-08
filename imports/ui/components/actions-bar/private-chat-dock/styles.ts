import styled from 'styled-components';
import { colorWhite } from '/imports/ui/stylesheets/styled-components/palette';

export const Dock = styled.div<{ $isOpen: boolean; $direction?: 'left' | 'right' }>`
  position: fixed;
  display: flex;
  flex-direction: row;
  gap: 8px;
  z-index: 10001;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  transform: ${({ $isOpen, $direction = 'left' }) => {
    if (!$isOpen) {
      // Khi đóng: scale nhỏ và slide về phía icon
      return $direction === 'left' 
        ? 'scale(0.8) translateX(30px) translateY(-10px)' 
        : 'scale(0.8) translateX(-30px) translateY(-10px)';
    }
    // Khi mở: scale bình thường và ở vị trí
    return 'scale(1) translateX(0) translateY(0)';
  }};
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), 
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  transform-origin: ${({ $direction = 'left' }) => ($direction === 'left' ? 'right center' : 'left center')};
  will-change: opacity, transform;
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
`;

export const DockItem = styled.button<{ $index?: number; $isOpen?: boolean; $direction?: 'left' | 'right' }>`
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.3s ease;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  transform: ${({ $isOpen, $index = 0, $direction = 'left' }) => {
    if (!$isOpen) {
      const offset = ($index + 1) * 20;
      return $direction === 'left' 
        ? `scale(0.6) translateX(${offset}px)` 
        : `scale(0.6) translateX(-${offset}px)`;
    }
    return 'scale(1) translateX(0)';
  }};
  transition-delay: ${({ $index = 0, $isOpen }) => $isOpen ? `${$index * 0.08}s` : '0s'};
  will-change: opacity, transform;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));

  &:hover {
    transform: scale(1.2) translateX(0) !important;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3)) brightness(1.1) !important;
    transition-delay: 0s !important;
    transition-duration: 0.2s !important;
  }

  &:active {
    transform: scale(0.95) translateX(0) !important;
    transition-delay: 0s !important;
    transition-duration: 0.1s !important;
  }
`;

export const Avatar = styled.div<{ bgColor: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${(props) => props.bgColor};
  color: ${colorWhite};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  overflow: hidden;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
`;

export const UnreadBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #f44336;
  color: ${colorWhite};
  border-radius: 12px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${colorWhite};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;
