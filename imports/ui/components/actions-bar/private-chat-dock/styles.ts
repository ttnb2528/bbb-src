import styled from 'styled-components';
import { colorWhite } from '/imports/ui/stylesheets/styled-components/palette';

export const Dock = styled.div`
  position: fixed;
  display: flex;
  flex-direction: row;
  gap: 8px;
  z-index: 10001;
  pointer-events: auto;
`;

export const DockItem = styled.button`
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
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
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
