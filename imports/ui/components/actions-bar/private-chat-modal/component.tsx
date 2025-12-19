import React, { useEffect, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
// @ts-ignore
import ReactModal from 'react-modal';
import Styled from './styles';
import ChatListContainer from '/imports/ui/components/user-list/user-list-content/user-messages/chat-list/component';
import ChatContainer from '/imports/ui/components/chat/chat-graphql/component';
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

  // Khởi tạo vị trí giữa màn hình khi mở modal
  useEffect(() => {
    if (isOpen && position === null) {
      const modalWidth = 900; // Luôn dùng width mặc định khi khởi tạo
      const modalHeight = window.innerHeight * 0.7;
      setPosition({
        left: window.innerWidth / 2 - modalWidth / 2,
        top: window.innerHeight / 2 - modalHeight / 2,
      });
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
    
    if (!isMinimized) {
      // Khi minimize: di chuyển về góc dưới bên phải, thu nhỏ thành icon
      setPosition({
        left: window.innerWidth - 60, // 60px width cho icon
        top: window.innerHeight - 60 - 80, // 60px height + 80px để tránh footer
      });
    } else {
      // Khi expand: về lại giữa màn hình
      const modalWidth = 900;
      const modalHeight = window.innerHeight * 0.7;
      setPosition({
        left: window.innerWidth / 2 - modalWidth / 2,
        top: window.innerHeight / 2 - modalHeight / 2,
      });
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
      overlayClassName="PrivateChatModal__overlay"
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
                <span>Message</span>
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
            <Styled.Content>
              {/* Bên trái: danh sách các cuộc chat (public + private) */}
              <Styled.LeftPane>
                <ChatListContainer disableLayoutInteractions />
              </Styled.LeftPane>
              {/* Bên phải: nội dung chat, dùng ChatContainer ở chế độ modal */}
              <Styled.RightPane>
                <ChatContainer mode="modal" />
              </Styled.RightPane>
            </Styled.Content>
          </>
        )}
      </Styled.Modal>
    </ReactModal>
  );
};

export default PrivateChatModal;

