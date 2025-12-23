import styled, { css } from 'styled-components';

const Draggable = styled.div<{
  $isDraggable: boolean;
  $isDragging: boolean;
}>`
  ${({ $isDraggable }) => $isDraggable && css`
    & > video {
      cursor: grabbing;
    }
  `}

  ${({ $isDragging }) => $isDragging && css`
    background-color: rgba(200, 200, 200, 0.5);
  `}
`;

const ResizableWrapper = styled.div<{
  $horizontal: boolean;
  $vertical: boolean;
}>`
  ${({ $horizontal }) => $horizontal && css`
    & > div div[style*="user-select: none"]:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }
  `}

  ${({ $vertical }) => $vertical && css`
    & > div div[style*="user-select: none"]:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }
  `}
`;

// PIP cố định cho cam nhỏ khi share
const PipWrapper = styled.div`
  position: fixed;
  top: 16px;
  left: 16px;
  width: 220px;
  height: 132px;
  z-index: 300;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  background: #000;

  /* Ngăn react-draggable áp transform đẩy cam xuống và ép translate 0, 8px */
  > div {
    position: relative !important;
    transform: translate(0px, 8px) !important;
    top: 0 !important;
    left: 0 !important;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export default {
  Draggable,
  ResizableWrapper,
  PipWrapper,
};
