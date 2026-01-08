import styled from 'styled-components';
import { colorWhite } from '/imports/ui/stylesheets/styled-components/palette';

export const Dock = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  display: flex;
  flex-direction: row;
  gap: 8px;
  z-index: 10001;
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  transform: ${({ $isOpen }) => ($isOpen ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-10px)')};
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), 
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  transform-origin: right center;
  will-change: opacity, transform;
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
`;

export const DockItem = styled.button<{ $index?: number; $isOpen?: boolean }>`
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  transform: ${({ $isOpen, $index = 0 }) => 
    $isOpen 
      ? `scale(1) translateX(0)` 
      : `scale(0.6) translateX(${($index + 1) * 20}px)`};
  transition-delay: ${({ $index = 0, $isOpen }) => $isOpen ? `${$index * 0.08}s` : '0s'};
  will-change: opacity, transform;

  &:hover {
    transform: scale(1.15) translateX(0) !important;
    transition-delay: 0s !important;
    transition-duration: 0.2s !important;
  }

  &:active {
    transform: scale(0.9) translateX(0) !important;
    transition-delay: 0s !important;
    transition-duration: 0.1s !important;
  }
`;

export const Avatar = styled.div<{ bgColor: string }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${(props) => props.bgColor};
  color: ${colorWhite};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
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
