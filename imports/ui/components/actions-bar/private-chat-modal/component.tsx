import React, { useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
// @ts-ignore
import ReactModal from 'react-modal';
import Styled from './styles';
import ChatContainer from '/imports/ui/components/chat/chat-graphql/component';
import Icon from '/imports/ui/components/common/icon/icon-ts/component';
import Button from '/imports/ui/components/common/button/component';
import useChat from '/imports/ui/core/hooks/useChat';
import { Chat } from '/imports/ui/Types/chat';
import { GraphqlDataHookSubscriptionResponse } from '/imports/ui/Types/hook';
import { colorPrimary } from '/imports/ui/stylesheets/styled-components/palette';

const isMobileViewport = () => (typeof window !== 'undefined' && window.innerWidth <= 640);

const intlMessages = defineMessages({
  privateChatTitle: {
    id: 'app.chat.titlePrivate',
    description: 'Private chat title',
  },
  closeLabel: {
    id: 'app.chat.closeChatLabel',
    description: 'Close chat label',
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
}) => {
  const intl = useIntl();
  const [isMinimized, setIsMinimized] = useState(externalIsMinimized);
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(initialPosition || null);
  const dragState = useRef<{ startX: number; startY: number; originLeft: number; originTop: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  // Lưu vị trí popup trước khi minimize để restore khi expand
  const savedPositionRef = useRef<{ left: number; top: number } | null>(null);
  
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
        // Mobile: fullscreen, top-left corner
        const newPosition = { left: 0, top: 0 };
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
  
  // Không cho minimized trên mobile để tránh UX rối
  useEffect(() => {
    if (isOpen && isMobileViewport() && isMinimized) setIsMinimized(false);
  }, [isOpen, isMinimized]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.button !== 0 || !position) return;
    e.preventDefault();
    hasDragged.current = false;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originLeft: position.left,
      originTop: position.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging || !position) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return;
      e.preventDefault();
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      
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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  const handleToggleMinimize = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isMobileViewport()) return; // mobile: bỏ qua minimize
    // Nếu vừa kéo thì bỏ qua click để không mở popup
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    // Đảm bảo luôn có position trước khi thao tác (tránh cần click lần 2)
    let currentPosition = position;
    if (!currentPosition) {
      // Nếu chưa có vị trí (mở popup lần đầu), tính vị trí mặc định
      const modalWidth = 360;
      const modalHeight = 460;
      const paddingRight = 16;
      const paddingBottom = 120;
      currentPosition = {
        left: window.innerWidth - modalWidth - paddingRight,
        top: window.innerHeight - modalHeight - paddingBottom,
      };
      setPosition(currentPosition);
      onPositionUpdate?.(currentPosition);
    }

    // Log để debug click 2 lần
    // eslint-disable-next-line no-console
    console.log('[PrivateChatModal] toggleMinimize click, externalIsMinimized:', externalIsMinimized, 'position:', currentPosition);

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
    const handleExternalOpenPrivateChat = () => {
      // Nếu modal đã mở nhưng đang minimized, expand nó ra
      if (isOpen && isMinimized) {
        expandModal();
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
    
    window.addEventListener('openPrivateChatModal', handleExternalOpenPrivateChat as EventListener);
    window.addEventListener('togglePrivateChatModal', handleTogglePrivateChatModal as EventListener);
    return () => {
      window.removeEventListener('openPrivateChatModal', handleExternalOpenPrivateChat as EventListener);
      window.removeEventListener('togglePrivateChatModal', handleTogglePrivateChatModal as EventListener);
    };
  }, [isOpen, isMinimized, onExpand, onRequestClose]); // Thêm onRequestClose vào dependencies

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
  const activeChatName = chatId && activeChat?.participant?.name
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
      overlayClassName={`PrivateChatModal__overlay ${isMinimized ? 'PrivateChatModal__overlay--minimized' : ''}`}
      appElement={document.getElementById('app') || undefined}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      style={{
        content: {
          top: isMobileViewport() ? '0' : `${position.top}px`,
          left: isMobileViewport() ? '0' : `${position.left}px`,
          right: isMobileViewport() ? '0' : 'auto',
          bottom: isMobileViewport() ? '0' : 'auto',
          margin: 0,
          padding: 0,
          border: 'none',
          borderRadius: isMobileViewport() ? '0' : '8px',
          overflow: 'visible',
          position: 'fixed',
          width: isMobileViewport() ? '100vw' : 'auto',
          height: isMobileViewport() ? '100vh' : 'auto',
        },
      }}
    >
      <Styled.Modal
        ref={modalRef}
        $minimized={isMinimized}
      >
        {isMinimized ? (
          // Khi minimized: hiển thị avatar của người đang chat, có thể kéo và đóng
          <Styled.MinimizedIcon
            onMouseDown={handleDragStart}
            onClick={() => {
              // Nếu vừa kéo thì bỏ qua click để không mở popup
              if (hasDragged.current) {
                hasDragged.current = false;
                return;
              }
              
              // Khi click vào icon minimized, dispatch event để parent xử lý
              // Parent sẽ quyết định expand hoặc toggle dock dựa trên số lượng chat minimized
              window.dispatchEvent(new CustomEvent('clickMinimizedChatIcon', {
                detail: { chatId },
              }));
            }}
          >
            {activeChat?.participant ? (
              <Styled.MinimizedAvatar
                moderator={activeChat.participant.role === window.meetingClientSettings.public.user.role_moderator}
                avatar={activeChat.participant.avatar || ''}
                $backgroundColor={activeChat.participant.color
                  ? (activeChat.participant.color.startsWith('#') ? activeChat.participant.color : `#${activeChat.participant.color}`)
                  : colorPrimary}
              >
                {activeChat.participant.avatar?.length === 0
                  ? activeChat.participant.name?.toLowerCase().slice(0, 2) || ''
                  : ''}
              </Styled.MinimizedAvatar>
            ) : (
              <Icon iconName="chat" />
            )}
            {unreadCount > 0 && (
              <Styled.UnreadBadge>
                {unreadCount > 99 ? '99+' : unreadCount}
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
            <Styled.Header onMouseDown={handleDragStart}>
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
                {!isMobileViewport() && (
                  <Button
                    icon="minus"
                    onClick={handleToggleMinimize}
                    label="Minimize"
                    hideLabel
                    size="md"
                    color="default"
                    data-test="togglePrivateChatSize"
                  />
                )}
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
                      Select a participant from the user list to start a private chat.
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