import styled from 'styled-components';
import { colorWhite, colorGrayLight } from '/imports/ui/stylesheets/styled-components/palette';
import {
  borderSize,
  navbarHeight,
  smPaddingX,
  borderRadius,
  xsPadding,
  smPaddingY,
} from '/imports/ui/stylesheets/styled-components/general';
import { smallOnly, mediumUp } from '/imports/ui/stylesheets/styled-components/breakpoints';

const SidebarContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${colorWhite};
  border-radius: ${borderRadius} 0 0 0;
  border: none;
  overflow: visible; /* cho phép nút handle lộ ra phía ngoài */
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.08);

  /* Hiệu ứng trượt ngang mượt mà */
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
              height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, height;

  /* Không cần data-collapsed vì transform đã xử lý việc ẩn/hiện */
`;

// Thanh handle ở mép trái của panel để kéo panel ra/vào (side slide)
const SideHandle = styled.button`
  appearance: none;
  border: none;
  background: #ff6b35;
  color: ${colorWhite};

  /* Nút hình "nửa hình tròn" dính vào mép trái panel */
  position: absolute;
  left: -32px; /* Nhô ra ngoài bên trái */
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;

  height: 48px;
  min-width: 24px;
  padding: 0 8px;
  border-radius: 999px 0 0 999px;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
  }

  /* Icon mũi tên > xoay để chỉ trái/phải */
  i[class*="icon-bbb-right_arrow"] {
    font-size: 16px;
    line-height: 1;
    display: inline-block;
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    transform: rotate(180deg); /* Xoay 180 độ để chỉ trái khi collapsed */
  }

  /* Xoay mũi tên về 0 độ để chỉ phải khi expanded */
  ${({ 'data-collapsed': collapsed }) => !collapsed && `
    i[class*="icon-bbb-right_arrow"] {
      transform: rotate(0deg) translateX(8px);
    }
  `}

  &:hover {
    background: #ff8555;
    box-shadow: -2px 0 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-50%) scale(1.05);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }
`;


// Area to render selected content
const ContentArea = styled.div`
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  opacity: 1;
  transition: opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;

  /* Không ẩn content khi collapsed, vì transform đã xử lý việc ẩn/hiện */
  /* Chỉ ẩn khi thực sự cần (ví dụ khi đang resize hoặc transition) */
`;

const Poll = styled.div`
  position: absolute;
  display: flex;
  flex-flow: column;
  overflow-y: auto;
  overflow-x: hidden;
  outline: transparent;
  outline-width: ${borderSize};
  outline-style: solid;
  order: 2;
  height: 100%;
  background-color: ${colorWhite};
  min-width: 20em;
  padding: ${smPaddingX};

  @media ${smallOnly} {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 5;
    height: auto;
    top: ${navbarHeight};
    overflow: auto;
     &.no-padding {
      padding: 0;
    }
  }

  @media ${mediumUp} {
    position: relative;
    order: 1;
  }
`;

export default {
  SidebarContentWrapper,
  SideHandle,
  ContentArea,
  Poll,
};
