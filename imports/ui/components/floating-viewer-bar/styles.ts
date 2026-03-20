import styled from "styled-components";

export const ViewerBarContainer = styled.div<{
  $isSidebarOpen?: boolean;
  $sidebarWidth?: number;
}>`
  position: absolute;
  top: 1.5rem;
  right: ${(props: any) =>
    props.$isSidebarOpen
      ? `calc(${props.$sidebarWidth}px + 1.5rem)`
      : "1.5rem"};
  transition:
    right 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.2s;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  padding: 0.4rem 0.5rem;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.6);
  }
`;

export const ViewerCount = styled.div`
  color: white;
  font-weight: bold;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding-left: 0.25rem;
  margin-right: 0.5rem;
`;

export const AvatarsWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const OverlappingAvatar = styled.div<{ $color: string; $index: number }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.5);
  background-color: ${(props: any) => props.$color || "#4184F3"};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.75rem;
  margin-left: ${(props: any) => (props.$index > 0 ? "-12px" : "0")};
  z-index: ${(props: any) => 10 - props.$index};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const UsersDropdown = styled.div`
  position: absolute;
  top: 120%;
  left: 0;
  width: 260px;
  max-height: 400px;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  overflow-y: auto;
  z-index: 100;
  padding: 0.5rem 0;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }
`;

export const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

export const DropdownAvatar = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${(props: any) => props.$color || "#4184F3"};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.85rem;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const DropdownName = styled.span`
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`;

export const PrivateChatBadge = styled.span`
  font-size: 0.75rem;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 0.15rem 0.4rem;
  border-radius: 10px;
  font-weight: 500;
`;
