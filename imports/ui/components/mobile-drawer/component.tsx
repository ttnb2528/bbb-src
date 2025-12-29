import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '/imports/ui/components/common/icon/component';
import Styled from './styles';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position: 'left' | 'right';
  children: React.ReactNode;
  title?: string;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  position,
  children,
  title,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <Styled.Overlay onClick={onClose} />
      <Styled.Drawer $position={position}>
        {title && (
          <Styled.Header>
            <Styled.Title>{title}</Styled.Title>
            <Styled.CloseButton onClick={onClose}>
              <Icon iconName="close" />
            </Styled.CloseButton>
          </Styled.Header>
        )}
        <Styled.Content>
          {children}
        </Styled.Content>
      </Styled.Drawer>
    </>,
    document.body
  );
};

export default MobileDrawer;

