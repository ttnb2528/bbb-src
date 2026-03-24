import React, { useEffect, useMemo, useRef, useState } from "react";
import { defineMessages, useIntl } from "react-intl";
// @ts-ignore
import ReactModal from "react-modal";
import Styled from "./styles";
import ChatContainer from "/imports/ui/components/chat/chat-graphql/component";
import Icon from "/imports/ui/components/common/icon/icon-ts/component";
import Button from "/imports/ui/components/common/button/component";
import useChat from "/imports/ui/core/hooks/useChat";
import { Chat } from "/imports/ui/Types/chat";
import { GraphqlDataHookSubscriptionResponse } from "/imports/ui/Types/hook";
import { colorPrimary } from "/imports/ui/stylesheets/styled-components/palette";

const isMobileViewport = () =>
  typeof window !== "undefined" && window.innerWidth <= 640;

const intlMessages = defineMessages({
  privateChatTitle: {
    id: "app.chat.titlePrivate",
    description: "Private chat title",
  },
  closeLabel: {
    id: "app.chat.closeChatLabel",
    description: "Close chat label",
  },
});

interface PrivateChatModalProps {
  chatId: string; // ChatId của popup này
  isOpen: boolean;
  isMinimized?: boolean; // Trạng thái minimized từ parent
  initialPosition?: { left: number; top: number } | null; // Vị trí ban đầu từ parent
  onRequestClose: () => void;
  onMinimize?: (position: { left: number; top: number }) => void; // Callback khi minimize
  onExpand?: () => void; // Callback để expand modal khi đang minimized
  onPositionUpdate?: (position: { left: number; top: number }) => void; // Callback khi vị trí thay đổi
  style?: React.CSSProperties; // Optional style để control visibility
}

const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
  chatId,
  isOpen,
  isMinimized: externalIsMinimized = false,
  initialPosition,
  onRequestClose,
  onMinimize,
  onExpand,
  onPositionUpdate,
  style,
}) => {
  const intl = useIntl();
  const [isMinimized, setIsMinimized] = useState(externalIsMinimized);
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(initialPosition || null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  // Lưu vị trí popup trước khi minimize để restore khi expand
  const savedPositionRef = useRef<{ left: number; top: number } | null>(null);

  // Handle click outside để đóng modal
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Bỏ qua nếu click vào modal hoặc các element con của modal
      if (modalRef.current && modalRef.current.contains(target)) {
        return;
      }

      // Trên desktop: đóng khi click bất kỳ đâu ngoài modal
      // Trên mobile: chỉ đóng khi click vào overlay (vì modal fullscreen)
      // Click outside logic now applies identically to mobile and desktop:
      // Instead of closing abruptly, clicking outside shrinks the chat back into the floating avatar icon.
      {
        // Desktop & Mobile: đóng khi click bất kỳ đâu ngoài modal
        // Bỏ qua nếu click vào các modal khác hoặc actions bar
        const isOtherModal =
          (target.closest('[class*="modal" i]') ||
            target.closest(".MuiPopover-root") ||
            target.closest('[class*="MuiPopover"]') ||
            target.closest('[class*="emoji"]')) &&
          !target.closest(".PrivateChatModal__overlay") &&
          !target.closest(".PrivateChatModal__content");
        const isActionsBar =
          target.closest('[data-test="actionsBar"]') ||
          target.closest('[class*="actions-bar"]');

        if (!isOtherModal && !isActionsBar) {
          // Minimize into a Chat Head dock instead of closing completely
          handleToggleMinimize();
        }
      }
    };

    // Thêm event listener với delay nhỏ để tránh trigger ngay khi mở
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMinimized, onRequestClose]);

  // Sử dụng chatId từ props (flow mới)
  const { data: chats } = useChat((chat) => ({
    chatId: chat.chatId,
    participant: chat.participant,
    totalUnread: chat.totalUnread,
  })) as GraphqlDataHookSubscriptionResponse<Partial<Chat>[]>;

  // Khởi tạo vị trí giữa màn hình khi mở modal
  useEffect(() => {
    // Ưu tiên sử dụng initialPosition từ parent nếu có
    if (initialPosition) {
      setPosition(initialPosition);
      return;
    }

    if (isOpen && position === null) {
      if (isMobileViewport()) {
        // Mobile: near bottom right, above actions bar
        const iconSize = 48;
        const paddingRight = 16;
        const paddingBottom = 100;
        const newPosition = {
          left: Math.max(0, window.innerWidth - iconSize - paddingRight),
          top: Math.max(0, window.innerHeight - iconSize - paddingBottom),
        };
        setPosition(newPosition);
        onPositionUpdate?.(newPosition);
      } else {
        // Desktop: popup nhỏ ở góc dưới bên phải (trên actions bar)
        const modalWidth = 360;
        const modalHeight = 460;
        const paddingRight = 16;
        const paddingBottom = 120; // chừa chỗ cho actions bar + margin
        const newPosition = {
          left: window.innerWidth - modalWidth - paddingRight,
          top: window.innerHeight - modalHeight - paddingBottom,
        };
        setPosition(newPosition);
        onPositionUpdate?.(newPosition);
      }
    }
  }, [isOpen, initialPosition, onPositionUpdate]);

  // Sync isMinimized và position với props từ parent
  useEffect(() => {
    setIsMinimized(externalIsMinimized);

    // Khi parent set isMinimized = true và có initialPosition (dock position), sync position
    if (externalIsMinimized && initialPosition) {
      setPosition(initialPosition);
    } else if (!externalIsMinimized && initialPosition) {
      // Khi expand, cũng cần sync position nếu có
      setPosition(initialPosition);
    }
  }, [externalIsMinimized, initialPosition]);

  // Sync position với initialPosition khi parent update (chỉ khi không đang drag)
  useEffect(() => {
    if (isDragging) return; // Không sync khi đang drag

    if (initialPosition && position) {
      // Chỉ update nếu position thay đổi đáng kể (tránh re-render không cần thiết)
      const deltaX = Math.abs(initialPosition.left - position.left);
      const deltaY = Math.abs(initialPosition.top - position.top);
      if (deltaX > 1 || deltaY > 1) {
        setPosition(initialPosition);
      }
    } else if (initialPosition && !position) {
      setPosition(initialPosition);
    }
  }, [initialPosition, isDragging]);

  // Không còn chặn minimized trên mobile nữa, cho phép thu nhỏ thành Chat Head (Floating avatar)

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = "touches" in e;
    if (!isTouch && (e as React.MouseEvent).button !== 0) return;
    if (!position) return;
    if (e.cancelable) e.preventDefault();
    hasDragged.current = false;

    const clientX = isTouch
      ? (e as React.TouchEvent).touches[0].clientX
      : (e as React.MouseEvent).clientX;
    const clientY = isTouch
      ? (e as React.TouchEvent).touches[0].clientY
      : (e as React.MouseEvent).clientY;

    dragState.current = {
      startX: clientX,
      startY: clientY,
      originLeft: position.left,
      originTop: position.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || !position) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!dragState.current) return;
      if (e.cancelable) e.preventDefault();

      const isTouch = "touches" in e;
      const clientX = isTouch
        ? (e as TouchEvent).touches[0].clientX
        : (e as MouseEvent).clientX;
      const clientY = isTouch
        ? (e as TouchEvent).touches[0].clientY
        : (e as MouseEvent).clientY;

      const dx = clientX - dragState.current.startX;
      const dy = clientY - dragState.current.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDragged.current = true;
      }

      // Tính toán vị trí mới không giới hạn
      const newLeft = dragState.current.originLeft + dx;
      const newTop = dragState.current.originTop + dy;

      const newPosition = {
        left: newLeft,
        top: Math.max(0, newTop), // Chỉ giới hạn Y không âm
      };
      setPosition(newPosition);
      onPositionUpdate?.(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragState.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("touchmove", handleMouseMove, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, position]);

  const handleToggleMinimize = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Cho phép mobile minimize
    // Nếu vừa kéo thì bỏ qua click để không mở popup
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    // Đảm bảo luôn có position trước khi thao tác (tránh cần click lần 2)
    let currentPosition = position;
    if (!currentPosition) {
      // Nếu chưa có vị trí (mở popup lần đầu), tính vị trí mặc định
      if (isMobileViewport()) {
        const iconSize = 48;
        const paddingRight = 16;
        const paddingBottom = 100;
        currentPosition = {
          left: Math.max(0, window.innerWidth - iconSize - paddingRight),
          top: Math.max(0, window.innerHeight - iconSize - paddingBottom),
        };
      } else {
        const modalWidth = 360;
        const modalHeight = 460;
        const paddingRight = 16;
        const paddingBottom = 120;
        currentPosition = {
          left: window.innerWidth - modalWidth - paddingRight,
          top: window.innerHeight - modalHeight - paddingBottom,
        };
      }
      setPosition(currentPosition);
      onPositionUpdate?.(currentPosition);
    }

    // Log để debug click 2 lần
    // eslint-disable-next-line no-console

    // Sử dụng externalIsMinimized thay vì isMinimized state để tránh delay
    // vì externalIsMinimized được cập nhật ngay lập tức từ parent
    if (!externalIsMinimized) {
      setIsMinimized(true); // tối ưu UI ngay lập tức
      // Khi minimize: lưu vị trí hiện tại để restore sau
      savedPositionRef.current = { ...currentPosition };
      // Truyền savedPosition để parent lưu lại và set position về dock
      // Parent sẽ xử lý việc set isMinimized và position
      // Gọi ngay lập tức để đảm bảo minimize hoạt động ngay
      onMinimize?.(savedPositionRef.current);
    } else {
      setIsMinimized(false); // mở ngay để tránh cần click 2 lần
      // Khi expand lại: restore vị trí cũ hoặc mở ngay tại icon nếu chưa có vị trí cũ
      if (savedPositionRef.current) {
        setPosition(savedPositionRef.current);
        savedPositionRef.current = null;
      } else {
        // Nếu chưa có vị trí cũ, mở ngay tại icon (góc dưới bên phải)
        const modalWidth = 360;
        const modalHeight = 460;
        const paddingRight = 16;
        const paddingBottom = 120;
        setPosition({
          left: window.innerWidth - modalWidth - paddingRight,
          top: window.innerHeight - modalHeight - paddingBottom,
        });
      }
      setIsMinimized(false);
      onExpand?.();
    }
  };

  // Helper function để expand modal
  const expandModal = () => {
    if (isMinimized) {
      setIsMinimized(false);
      // Restore vị trí cũ hoặc mở ngay tại icon
      if (savedPositionRef.current) {
        setPosition(savedPositionRef.current);
        savedPositionRef.current = null;
      } else {
        // Mở ngay tại icon (góc dưới bên phải)
        const modalWidth = 360;
        const modalHeight = 460;
        const paddingRight = 16;
        const paddingBottom = 120;
        setPosition({
          left: window.innerWidth - modalWidth - paddingRight,
          top: window.innerHeight - modalHeight - paddingBottom,
        });
      }
      if (onExpand) onExpand();
    }
  };

  // Listen for external private chat modal open event với userId từ user list
  // Setup listener một lần khi component mount để nhận userId từ event
  // Không cần check isOpen vì event có thể được dispatch trước khi modal mở
  useEffect(() => {
    const handleExternalOpenPrivateChat = (e: Event) => {
      // CHỈ expand modal này nếu chatId trong event khớp với chatId của modal này
      // Tránh expand tất cả các modal khi mở chat mới
      if (e instanceof CustomEvent && e.detail?.chatId) {
        const eventChatId = e.detail.chatId;
        // Chỉ expand nếu chatId khớp
        if (eventChatId === chatId && isOpen && isMinimized) {
          expandModal();
        }
      }
    };

    const handleTogglePrivateChatModal = () => {
      // Khi toggle và modal đã mở
      if (isOpen) {
        if (isMinimized) {
          // Nếu đang minimized, expand nó
          expandModal();
        } else {
          // Nếu không minimized, đóng modal
          onRequestClose();
        }
      }
    };

    window.addEventListener(
      "openPrivateChatModal",
      handleExternalOpenPrivateChat as EventListener,
    );
    window.addEventListener(
      "togglePrivateChatModal",
      handleTogglePrivateChatModal as EventListener,
    );
    return () => {
      window.removeEventListener(
        "openPrivateChatModal",
        handleExternalOpenPrivateChat as EventListener,
      );
      window.removeEventListener(
        "togglePrivateChatModal",
        handleTogglePrivateChatModal as EventListener,
      );
    };
  }, [isOpen, isMinimized, onExpand, onRequestClose, chatId]); // Thêm chatId vào dependencies

  // Reset position khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      setIsMinimized(false);
      savedPositionRef.current = null; // Reset saved position
    }
  }, [isOpen]);

  // Sử dụng chatId từ props (flow mới)
  // useMemo phải được gọi ở top level, không được sau early return
  const activeChat = useMemo(
    () => chats?.find((c) => c.chatId === chatId),
    [chats, chatId],
  );

  // Chỉ hiển thị tên người khi đã chọn chat, nếu không thì hiển thị "Messages"
  const activeChatName =
    chatId && activeChat?.participant?.name
      ? activeChat.participant.name
      : intl.formatMessage(intlMessages.privateChatTitle);

  // Tính unread count cho active chat
  const unreadCount = activeChat?.totalUnread || 0;

  if (!position) return null;

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={intl.formatMessage(intlMessages.privateChatTitle)}
      className="PrivateChatModal__content"
      overlayClassName={`PrivateChatModal__overlay ${isMinimized ? "PrivateChatModal__overlay--minimized" : ""}`}
      appElement={document.getElementById("app") || undefined}
      shouldCloseOnOverlayClick={!isMinimized}
      shouldCloseOnEsc={!isMinimized}
      style={{
        content: {
          top: isMobileViewport() && !isMinimized ? "0" : `${position.top}px`,
          left: isMobileViewport() && !isMinimized ? "0" : `${position.left}px`,
          right: "auto",
          bottom: "auto",
          margin: 0,
          padding: 0,
          border: "none",
          borderRadius: isMobileViewport() && !isMinimized ? "0" : "8px",
          overflow: "visible",
          position: "fixed",
          width: "auto",
          height: "auto",
          ...style, // Merge với style từ props
        },
        overlay: {
          backgroundColor: isMinimized ? "transparent" : "rgba(0, 0, 0, 0.1)",
          zIndex: 1005,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
      }}
    >
      <Styled.Modal ref={modalRef} $minimized={isMinimized}>
        {isMinimized ? (
          // Khi minimized: hiển thị avatar của người đang chat, có thể kéo và đóng
          <Styled.MinimizedIcon
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onClick={() => {
              // Nếu vừa kéo thì bỏ qua click để không mở popup
              if (hasDragged.current) {
                hasDragged.current = false;
                return;
              }

              // Khi click vào icon minimized, dispatch event để parent xử lý
              // Parent sẽ quyết định expand hoặc toggle dock dựa trên số lượng chat minimized
              window.dispatchEvent(
                new CustomEvent("clickMinimizedChatIcon", {
                  detail: { chatId },
                }),
              );
            }}
          >
            {activeChat?.participant ? (
              <Styled.MinimizedAvatar
                moderator={
                  activeChat.participant.role ===
                  window.meetingClientSettings.public.user.role_moderator
                }
                avatar={activeChat.participant.avatar || ""}
                $backgroundColor={
                  activeChat.participant.color
                    ? activeChat.participant.color.startsWith("#")
                      ? activeChat.participant.color
                      : `#${activeChat.participant.color}`
                    : colorPrimary
                }
              >
                {activeChat.participant.avatar?.length === 0
                  ? activeChat.participant.name?.toUpperCase().slice(0, 2) || ""
                  : ""}
              </Styled.MinimizedAvatar>
            ) : (
              <Icon iconName="chat" />
            )}
            {unreadCount > 0 && (
              <Styled.UnreadBadge>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Styled.UnreadBadge>
            )}
            <Styled.MinimizedClose
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // Đóng modal hoàn toàn
                onRequestClose();
              }}
              onMouseDown={(e) => {
                // Prevent drag khi click vào nút X
                e.stopPropagation();
              }}
            >
              <Icon iconName="close" />
            </Styled.MinimizedClose>
          </Styled.MinimizedIcon>
        ) : (
          <>
            <Styled.Header
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <Styled.Title>
                <Icon iconName="chat" />
                <span>{activeChatName}</span>
              </Styled.Title>
              <Styled.HeaderActions
                onMouseDown={(e) => {
                  // Ngăn drag khi click vào các button trong header
                  e.stopPropagation();
                }}
              >
                <Button
                  icon="minus"
                  onClick={handleToggleMinimize}
                  label="Minimize"
                  hideLabel
                  size="md"
                  color="default"
                  data-test="togglePrivateChatSize"
                />
                <Button
                  icon="close"
                  onClick={onRequestClose}
                  label={intl.formatMessage(intlMessages.closeLabel)}
                  hideLabel
                  size="md"
                  color="default"
                  data-test="closePrivateChatModal"
                />
              </Styled.HeaderActions>
            </Styled.Header>
            <Styled.Content>
              <Styled.RightPane>
                {chatId ? (
                  <ChatContainer mode="modal" chatId={chatId} />
                ) : (
                  <Styled.EmptyState>
                    <span>
                      Select a participant from the user list to start a private
                      chat.
                    </span>
                  </Styled.EmptyState>
                )}
              </Styled.RightPane>
            </Styled.Content>
          </>
        )}
      </Styled.Modal>
    </ReactModal>
  );
};

export default PrivateChatModal;
