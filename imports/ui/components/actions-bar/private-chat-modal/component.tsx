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
import usePendingChat from '/imports/ui/core/local-states/usePendingChat';
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
  isOpen: boolean;
  onRequestClose: () => void;
  onExpand?: () => void; // Callback để expand modal khi đang minimized
}

const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
  isOpen,
  onRequestClose,
  onExpand,
}) => {
  const intl = useIntl();
  const [isMinimized, setIsMinimized] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; originLeft: number; originTop: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  // Lưu vị trí popup trước khi minimize để restore khi expand
  const savedPositionRef = useRef<{ left: number; top: number } | null>(null);
  
  // State riêng để quản lý chatId của private chat modal, độc lập với idChatOpen từ layout context
  const [privateChatId, setPrivateChatId] = useState<string>('');
  // State để lưu userId từ event khi mở modal từ user list
  const [pendingUserId, setPendingUserId] = useState<string>('');
  const { data: chats } = useChat((chat) => ({
    chatId: chat.chatId,
    participant: chat.participant,
    totalUnread: chat.totalUnread,
  })) as GraphqlDataHookSubscriptionResponse<Partial<Chat>[]>;
  
  // Xử lý pendingChat để tự động mở chat khi user click "Start Private Chat" từ user list (flow cũ)
  const [pendingChat, setPendingChat] = usePendingChat();
  
  // Khởi tạo vị trí giữa màn hình khi mở modal
  useEffect(() => {
    if (isOpen && position === null) {
      if (isMobileViewport()) {
        // Mobile: fullscreen, top-left corner
        setPosition({
          left: 0,
          top: 0,
        });
      } else {
        // Desktop: popup nhỏ ở góc dưới bên phải (trên actions bar)
        const modalWidth = 360;
        const modalHeight = 460;
        const paddingRight = 16;
        const paddingBottom = 120; // chừa chỗ cho actions bar + margin
        setPosition({
          left: window.innerWidth - modalWidth - paddingRight,
          top: window.innerHeight - modalHeight - paddingBottom,
        });
      }
    }
  }, [isOpen, position]);

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
      
      setPosition({
        left: newLeft,
        top: Math.max(0, newTop), // Chỉ giới hạn Y không âm
      });
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

  const handleToggleMinimize = () => {
    if (isMobileViewport()) return; // mobile: bỏ qua minimize
    // Nếu vừa kéo thì bỏ qua click để không mở popup
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    if (!position) return;

    if (!isMinimized) {
      // Khi minimize: lưu vị trí hiện tại và di chuyển về góc dưới bên phải
      savedPositionRef.current = { ...position };
      const iconSize = 56;
      setPosition({
        left: window.innerWidth - iconSize - 16,
        top: window.innerHeight - iconSize - 96, // tránh đè actions bar
      });
    } else {
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
    }
    setIsMinimized((prev) => !prev);
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
      // Nếu modal đã mở nhưng đang minimized, expand nó ra
      if (isOpen && isMinimized) {
        expandModal();
      }
      
      // Nếu event có detail với userId hoặc chatId, lưu lại để xử lý khi modal mở
      if (e instanceof CustomEvent) {
        if (e.detail?.userId) {
          setPendingUserId(e.detail.userId);
          setPendingChat('');
        } else if (e.detail?.chatId) {
          // Nếu có chatId trực tiếp, set luôn
          setPrivateChatId(e.detail.chatId);
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
    
    window.addEventListener('openPrivateChatModal', handleExternalOpenPrivateChat as EventListener);
    window.addEventListener('togglePrivateChatModal', handleTogglePrivateChatModal as EventListener);
    return () => {
      window.removeEventListener('openPrivateChatModal', handleExternalOpenPrivateChat as EventListener);
      window.removeEventListener('togglePrivateChatModal', handleTogglePrivateChatModal as EventListener);
    };
  }, [isOpen, isMinimized, setPendingChat, onExpand, onRequestClose]); // Thêm onRequestClose vào dependencies

  // Reset position khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      setIsMinimized(false);
      setPrivateChatId('');
      setPendingUserId('');
      savedPositionRef.current = null; // Reset saved position
    }
  }, [isOpen]);

  // Xử lý pendingUserId khi mở modal từ user list (click "Start Private Chat")
  // Ưu tiên xử lý pendingUserId từ event detail (flow mới, không dùng pendingChat)
  useEffect(() => {
    if (isOpen && pendingUserId && chats) {
      const chat = chats.find((c) => c.participant?.userId === pendingUserId);
      if (chat && chat.chatId) {
        setPrivateChatId(chat.chatId);
        setPendingUserId(''); // Clear sau khi đã tìm thấy
      }
    }
  }, [isOpen, pendingUserId, chats]);
  
  // Xử lý pendingChat khi mở modal từ flow cũ (backward compatibility)
  // Chỉ xử lý nếu không có pendingUserId (để ưu tiên flow mới)
  useEffect(() => {
    if (isOpen && !pendingUserId && pendingChat && chats) {
      const chat = chats.find((c) => c.participant?.userId === pendingChat);
      if (chat && chat.chatId) {
        setPrivateChatId(chat.chatId);
        setPendingChat('');
      }
    }
  }, [isOpen, pendingUserId, pendingChat, chats, setPendingChat]);
  
  // Clear pendingUserId khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setPendingUserId('');
    }
  }, [isOpen]);
  
  // Đảm bảo private chat modal chỉ hiển thị private chat
  // Khi mở modal và ở tab private, tự động chọn private chat đầu tiên (nếu có)
  // Sử dụng state riêng privateChatId để không ảnh hưởng đến sidebar-content
  useEffect(() => {
    // Khi không có pendingUserId/pendingChat và chưa chọn privateChatId,
    // tự động chọn private chat đầu tiên nếu có
    if (isOpen && chats && !pendingChat && !pendingUserId) {
      const CHAT_CONFIG = window.meetingClientSettings.public.chat;
      const PUBLIC_GROUP_CHAT_ID = CHAT_CONFIG.public_group_id;
      
      // Nếu chưa có privateChatId hoặc privateChatId là public chat, thì tìm private chat đầu tiên
      if (!privateChatId || privateChatId === PUBLIC_GROUP_CHAT_ID) {
        const privateChats = chats.filter((c) => c.chatId && c.chatId !== PUBLIC_GROUP_CHAT_ID);
        if (privateChats.length > 0) {
          // Chọn private chat đầu tiên và lưu vào state riêng
          setPrivateChatId(privateChats[0].chatId!);
        }
      }
    }
  }, [isOpen, privateChatId, chats, pendingChat, pendingUserId]);
  
  // Reset privateChatId khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setPrivateChatId('');
    }
  }, [isOpen]);

  // useMemo phải được gọi ở top level, không được sau early return
  const activeChat = useMemo(
    () => chats?.find((c) => c.chatId === privateChatId),
    [chats, privateChatId],
  );

  // Chỉ hiển thị tên người khi đã chọn chat, nếu không thì hiển thị "Messages"
  const activeChatName = privateChatId && activeChat?.participant?.name
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
            onClick={handleToggleMinimize}
          >
            {activeChat?.participant ? (
              <Styled.MinimizedAvatar
                moderator={activeChat.participant.role === window.meetingClientSettings.public.user.role_moderator}
                avatar={activeChat.participant.avatar || ''}
                style={{
                  backgroundColor: activeChat.participant.color
                    ? (activeChat.participant.color.startsWith('#') ? activeChat.participant.color : `#${activeChat.participant.color}`)
                    : colorPrimary,
                }}
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
                {privateChatId ? (
                  <ChatContainer mode="modal" chatId={privateChatId} />
                ) : (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#555',
                  }}
                  >
                    <span>
                      Select a participant from the user list to start a private chat.
                    </span>
                  </div>
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