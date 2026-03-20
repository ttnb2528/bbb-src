import React, { useState, useEffect, useRef } from "react";
import * as Styled from "./styles";
import { UserBasicInfo } from "/imports/ui/Types/user";

interface Props {
  users: UserBasicInfo[];
  isSidebarOpen?: boolean;
  sidebarWidth?: number;
}

const FloatingViewerBarComponent: React.FC<Props> = ({
  users,
  isSidebarOpen,
  sidebarWidth,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Sắp xếp: Moderator lên đầu, sau đó theo tên
  const sortedUsers = [...users].sort((a, b) => {
    if (a.isModerator && !b.isModerator) return -1;
    if (!a.isModerator && b.isModerator) return 1;
    return a.name.localeCompare(b.name);
  });

  const topUsers = sortedUsers.slice(0, 5);

  const startPrivateChat = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // ngăn chặn toggle container
    window.dispatchEvent(
      new CustomEvent("openPrivateChatModal", { detail: { userId } }),
    );
    setIsDropdownOpen(false);
  };

  return (
    <Styled.ViewerBarContainer
      $isSidebarOpen={isSidebarOpen}
      $sidebarWidth={sidebarWidth}
      ref={dropdownRef}
      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    >
      <Styled.ViewerCount>
        <span role="img" aria-label="viewers">
          👁️
        </span>{" "}
        {users.length}
      </Styled.ViewerCount>

      <Styled.AvatarsWrapper>
        {topUsers.map((user, index) => (
          <Styled.OverlappingAvatar
            key={user.userId}
            $color={
              user.color?.startsWith("#")
                ? user.color
                : `#${user.color || "4184F3"}`
            }
            $index={index}
            title={user.name}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              user.name.substring(0, 2).toUpperCase()
            )}
          </Styled.OverlappingAvatar>
        ))}
      </Styled.AvatarsWrapper>

      {isDropdownOpen && (
        <Styled.UsersDropdown onClick={(e: any) => e.stopPropagation()}>
          {sortedUsers.map((user) => (
            <Styled.DropdownItem
              key={user.userId}
              onClick={(e: any) => startPrivateChat(user.userId, e)}
            >
              <Styled.DropdownAvatar
                $color={
                  user.color?.startsWith("#")
                    ? user.color
                    : `#${user.color || "4184F3"}`
                }
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  user.name.substring(0, 2).toUpperCase()
                )}
              </Styled.DropdownAvatar>
              <Styled.DropdownName>
                {user.name} {user.isModerator && " 🛡️"}
              </Styled.DropdownName>
              <Styled.PrivateChatBadge>Nhắn tin</Styled.PrivateChatBadge>
            </Styled.DropdownItem>
          ))}
        </Styled.UsersDropdown>
      )}
    </Styled.ViewerBarContainer>
  );
};

export default FloatingViewerBarComponent;
