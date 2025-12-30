import styled from 'styled-components';
import { colorWhite, colorGrayLight } from '/imports/ui/stylesheets/styled-components/palette';
import { borderSize, borderRadius, smPaddingX, smPaddingY } from '/imports/ui/stylesheets/styled-components/general';

const SidebarNavigationWrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${colorWhite};
  border-radius: 0 ${borderRadius} 0 0;
  border: none;
  overflow: visible; /* cho phép nút handle lộ ra phía ngoài */
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);

  /* Hiệu ứng trượt ngang mượt mà */
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
              height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform, height;

  /* Không cần data-collapsed vì transform đã xử lý việc ẩn/hiện */
`;

// Thanh handle ở mép phải của panel để kéo panel ra/vào (side slide)
const SideHandle = styled.button`
  appearance: none;
  border: none;
  background: #ff6b35;
  color: ${colorWhite};

  /* Nút hình "nửa hình tròn" dính vào mép phải panel */
  position: absolute;
  right: -32px; /* Nhô ra ngoài bên phải */
  top: 65%;
  z-index: 10;

  height: 48px;
  min-width: 24px;
  padding: 0 8px;
  border-radius: 0 999px 999px 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);

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
    transform: rotate(0deg); /* Xoay 0 độ để chỉ phải (>) khi collapsed (sidebar ẩn) - click để mở */
  }

  /* Xoay mũi tên 180 độ để chỉ trái (<) khi expanded (sidebar mở) - click để đóng */
  ${({ 'data-collapsed': collapsed }) => !collapsed && `
    i[class*="icon-bbb-right_arrow"] {
      transform: rotate(180deg) translateX(8px);
    }
  `}

  &:hover {
    background: #ff8555;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.2);
    transform: scale(1.05);
  }

  &:active { 
    transform: scale(0.95);
  }
`;

// Area to render content
const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  opacity: 1;
  transition: opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  /* Không ẩn content khi collapsed, vì transform đã xử lý việc ẩn/hiện */
`;

export default {
  SidebarNavigationWrapper,
  SideHandle,
  ContentArea,
};

