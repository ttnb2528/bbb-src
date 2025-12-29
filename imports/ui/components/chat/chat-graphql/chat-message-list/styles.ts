import styled from 'styled-components';
import { smPaddingX } from '/imports/ui/stylesheets/styled-components/general';
import { ScrollboxVertical } from '/imports/ui/stylesheets/styled-components/scrollable';
import { ButtonElipsis } from '/imports/ui/stylesheets/styled-components/placeholders';

interface MessageListProps {
  isRTL: boolean;
  $hasMessageToolbar: boolean;
}

interface UnreadButtonProps {
  isRTL: boolean;
}

export const MessageList = styled(ScrollboxVertical)<MessageListProps>`
  flex-flow: column;
  outline-style: none;
  overflow-x: hidden;
  height: 100%;
  width: 100%;
  z-index: 2;
  overflow-y: auto;
  position: absolute;
  display: flex;
  padding: 1.25rem 1rem 1rem 1rem;
  gap: 0;

  /* Smooth scrolling */
  scroll-behavior: smooth;
  
  /* Custom scrollbar styling - modern thin scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    transition: background 0.2s ease;
    
    &:hover {
      background: rgba(0, 0, 0, 0.25);
    }
  }
  
  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
`;

export const UnreadButton = styled(ButtonElipsis)<UnreadButtonProps>`
  flex-shrink: 0;
  text-transform: uppercase;
  margin-bottom: .25rem;
  z-index: 3;
  position: absolute;
  bottom: 0;

  ${({ isRTL }) => isRTL && `
    left: ${smPaddingX};
    right: 0;
  `}

  ${({ isRTL }) => !isRTL && `
    left: 0;
    right: ${smPaddingX};
  `}
`;

export const PageWrapper = styled.div``;

export const Content = styled.div`
  height: 100%;
  position: relative;
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
`;

export default {
  MessageList,
  UnreadButton,
  PageWrapper,
  Content,
};
