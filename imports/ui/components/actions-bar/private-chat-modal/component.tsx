import React, { useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
// @ts-ignore
import ReactModal from 'react-modal';
import Styled from './styles';
import ChatListContainer from '/imports/ui/components/user-list/user-list-content/user-messages/chat-list/component';
import ChatContainer from '/imports/ui/components/chat/chat-graphql/component';
import NotesContainer from '/imports/ui/components/notes/component';
import Icon from '/imports/ui/components/common/icon/icon-ts/component';
import Button from '/imports/ui/components/common/button/component';
import { layoutSelect, layoutDispatch, layoutSelectInput } from '/imports/ui/components/layout/context';
import { Layout, Input } from '/imports/ui/components/layout/layoutTypes';
import { ACTIONS, PANELS } from '/imports/ui/components/layout/enums';
import useChat from '/imports/ui/core/hooks/useChat';
import { Chat } from '/imports/ui/Types/chat';
import { GraphqlDataHookSubscriptionResponse } from '/imports/ui/Types/hook';

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
  isPublicChatDrawerOpen?: boolean; // Thêm prop để biết drawer public chat có đang mở không
}

const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
  isOpen,
  onRequestClose,
  isPublicChatDrawerOpen = false,
}) => {
  const intl = useIntl();
  const [isMinimized, setIsMinimized] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; originLeft: number; originTop: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const [activeTab, setActiveTab] = useState<'private' | 'notes'>('private');
  
  // State riêng để quản lý chatId của private chat modal, độc lập với idChatOpen từ layout context
  const [privateChatId, setPrivateChatId] = useState<string>('');
  
  const layoutContextDispatch = layoutDispatch();
  const sidebarContent = layoutSelectInput((i: Input) => i.sidebarContent);
  const { data: chats } = useChat((chat) => ({
    chatId: chat.chatId,
  })) as GraphqlDataHookSubscriptionResponse<Partial<Chat>[]>;
  
  // Kiểm tra xem sidebar-content có đang mở và ở tab CHAT không (cho desktop)
  const isSidebarContentChatOpen = sidebarContent?.sidebarContentPanel === PANELS.CHAT;

  // Khởi tạo vị trí giữa màn hình khi mở modal
  useEffect(() => {
    if (isOpen && position === null) {
      const isMobile = window.innerWidth <= 640; // smallOnly breakpoint
      if (isMobile) {
        // Mobile: fullscreen, top-left corner
        setPosition({
          left: 0,
          top: 0,
        });
      } else {
        // Desktop: center
        const modalWidth = 900;
        const modalHeight = window.innerHeight * 0.7;
        setPosition({
          left: window.innerWidth / 2 - modalWidth / 2,
          top: window.innerHeight / 2 - modalHeight / 2,
        });
      }
    }
  }, [isOpen, position]);

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
    // Nếu vừa kéo thì bỏ qua click để không mở popup
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    if (!position) return;
    
    const isMobile = window.innerWidth <= 640; // smallOnly breakpoint
    
    if (!isMinimized) {
      // Khi minimize: di chuyển về góc dưới bên phải, thu nhỏ thành icon
      const iconSize = isMobile ? 44 : 56;
      setPosition({
        left: window.innerWidth - iconSize - 8, // icon size + padding
        top: window.innerHeight - iconSize - 80, // icon size + 80px để tránh footer
      });
    } else {
      // Khi expand: về lại vị trí phù hợp
      if (isMobile) {
        // Mobile: fullscreen
        setPosition({
          left: 0,
          top: 0,
        });
      } else {
        // Desktop: center
        const modalWidth = 900;
        const modalHeight = window.innerHeight * 0.7;
        setPosition({
          left: window.innerWidth / 2 - modalWidth / 2,
          top: window.innerHeight / 2 - modalHeight / 2,
        });
      }
    }
    setIsMinimized((prev) => !prev);
  };

  // Reset position khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      setIsMinimized(false);
    }
  }, [isOpen]);

  // Đảm bảo private chat modal chỉ hiển thị private chat
  // Khi mở modal và ở tab private, tự động chọn private chat đầu tiên (nếu có)
  // Sử dụng state riêng privateChatId để không ảnh hưởng đến sidebar-content
  useEffect(() => {
    if (isOpen && activeTab === 'private' && chats) {
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
  }, [isOpen, activeTab, privateChatId, chats]);
  
  // Reset privateChatId khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setPrivateChatId('');
    }
  }, [isOpen]);

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
          top: `${position.top}px`,
          left: `${position.left}px`,
          right: 'auto',
          bottom: 'auto',
          margin: 0,
          padding: 0,
          border: 'none',
          borderRadius: '8px',
          overflow: 'visible',
          position: 'fixed',
        },
      }}
    >
      <Styled.Modal
        ref={modalRef}
        $minimized={isMinimized}
      >
        {isMinimized ? (
          // Khi minimized: chỉ hiện icon chat nhỏ, có thể kéo và đóng
          <Styled.MinimizedIcon
            onMouseDown={handleDragStart}
            onClick={handleToggleMinimize}
          >
            <Icon iconName="chat" />
            <Styled.MinimizedClose
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestClose();
              }}
            >
              <Icon iconName="close" />
            </Styled.MinimizedClose>
          </Styled.MinimizedIcon>
        ) : (
          <>
            <Styled.Header>
              <Styled.Title onMouseDown={handleDragStart}>
                <Icon iconName="chat" />
                <span>{activeTab === 'private' ? 'Message' : 'Shared Notes'}</span>
              </Styled.Title>
              <Styled.HeaderActions>
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
            <Styled.TabBar>
              <Styled.TabButton
                type="button"
                data-active={activeTab === 'private'}
                onClick={() => setActiveTab('private')}
              >
                Private
              </Styled.TabButton>
              <Styled.TabButton
                type="button"
                data-active={activeTab === 'notes'}
                onClick={() => setActiveTab('notes')}
              >
                Notes
              </Styled.TabButton>
            </Styled.TabBar>
            <Styled.Content>
              {activeTab === 'private' && (
                <>
                  <Styled.LeftPane>
                    <ChatListContainer 
                      disableLayoutInteractions 
                      filterPrivateOnly 
                      onChatSelect={(chatId) => setPrivateChatId(chatId)}
                    />
                  </Styled.LeftPane>
                  <Styled.RightPane>
                    {privateChatId ? (
                      <ChatContainer mode="modal" chatId={privateChatId} />
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <span>Select a chat to start messaging</span>
                      </div>
                    )}
                  </Styled.RightPane>
                </>
              )}
              {activeTab === 'notes' && (
                <Styled.RightPane>
                  <NotesContainer isToSharedNotesBeShow />
                </Styled.RightPane>
              )}
            </Styled.Content>
          </>
        )}
      </Styled.Modal>
    </ReactModal>
  );
};

export default PrivateChatModal;


