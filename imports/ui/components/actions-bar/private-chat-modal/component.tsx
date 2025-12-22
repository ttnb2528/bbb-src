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
}

const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
  isOpen,
  onRequestClose,
}) => {
  const intl = useIntl();
  const [isMinimized, setIsMinimized] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; originLeft: number; originTop: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const [activeTab, setActiveTab] = useState<'private' | 'notes'>('private');

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
                    <ChatListContainer disableLayoutInteractions filterPrivateOnly />
                  </Styled.LeftPane>
                  <Styled.RightPane>
                    <ChatContainer mode="modal" />
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

