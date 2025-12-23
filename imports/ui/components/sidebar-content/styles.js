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
  border-radius: 0 ${borderRadius} 0 0;
  border: none; /* Bỏ border theo yêu cầu */
  overflow: visible; /* cho phép nút handle lộ ra phía trên */
  display: flex;
  flex-direction: column;
  position: relative; /* Needed for absolute TabBar on the right */

  /* Hiệu ứng bottom-sheet mượt mà - trượt xuống khi ẩn, kéo lên khi hiện */
  transition: height 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: height, transform;

  ${({ 'data-collapsed': collapsed }) => collapsed && `
    background: transparent;
    border: none;
  `}
`;

// Thanh handle ở mép trên của panel để kéo panel lên / xuống (bottom sheet)
const BottomHandle = styled.button`
  appearance: none;
  border: none;
  background: #ff6b35;
  color: ${colorWhite};

  /* Nút hình "nửa hình tròn" dính vào mép trên panel */
  position: absolute;
  top: -24px; /* Hạ xuống một chút cho đẹp hơn */
  right: 24px; /* gần sát góc phải */
  left: auto;
  transform: none;
  z-index: 10;

  height: 24px;
  min-width: 48px;
  padding: 0 16px;
  border-radius: 999px 999px 0 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.35);

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 600;

  &:focus {
    outline: none;
  }

  /* Icon mũi tên > xoay để chỉ lên/xuống */
  i[class*="icon-bbb-right_arrow"] {
    font-size: 18px;
    line-height: 1;
    display: inline-block;
    transition: transform 0.3s ease;
    transform: rotate(-90deg); /* Xoay -90 độ để chỉ lên khi collapsed */
  }

  /* Xoay mũi tên 90 độ để chỉ xuống khi expanded */
  ${({ 'data-collapsed': collapsed }) => !collapsed && `
    i[class*="icon-bbb-right_arrow"] {
      transform: translateY(6px) translateX(-1px) rotate(90deg);
    }
  `}

  &:hover {
    background: #ff8555;
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Tab bar không còn dùng (đã có handle mới) – giữ lại để tránh lỗi import nhưng ẩn hoàn toàn
const TabBar = styled.div`
  display: none;
`;

const TabButton = styled.button`
  appearance: none;
  border: ${borderSize} solid ${colorGrayLight};
  border-radius: ${borderRadius};
  background: ${(props) => (props['data-active'] ? colorGrayLight : colorWhite)};
  padding: ${smPaddingY} ${xsPadding};
  min-height: 64px;
  width: 100%;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

// Wrapper to keep nav items (Chat list, Notes button)
const TabNavContent = styled.div`
  display: none; /* Hide legacy list to save space; we use tab buttons */
`;

// Area to render selected content
const ContentArea = styled.div`
  flex: 1;
  overflow: auto;
  padding: ${smPaddingY} ${smPaddingX} ${smPaddingY} ${smPaddingX};
  /* Không cần chừa chỗ cho TabBar bên phải nữa */
  padding-right: ${smPaddingX};
  display: flex;
  flex-direction: column;
  gap: ${smPaddingY};
  opacity: 1;
  transition: max-height 0.7s cubic-bezier(0.4, 0, 0.2, 1), padding 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out;

  ${({ 'data-collapsed': collapsed }) => collapsed && `
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    padding-right: ${smPaddingX};
    overflow: hidden;
    opacity: 0;
  `}
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
  BottomHandle,
  TabBar,
  TabButton,
  TabNavContent,
  ContentArea,
  Poll,
};
