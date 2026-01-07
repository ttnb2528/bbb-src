import styled from 'styled-components';
import { colorWhite, colorBackground, colorDanger } from '/imports/ui/stylesheets/styled-components/palette';
import { smPaddingX, smPaddingY, borderRadius, borderSize } from '/imports/ui/stylesheets/styled-components/general';
import { hasPhoneWidth, smallOnly } from '/imports/ui/stylesheets/styled-components/breakpoints';

const Container = styled.div`
  position: fixed;
  bottom: calc(var(--actionbar-height, 80px) + 8px);
  left: 8px;
  right: 8px;
  transform: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background-color: ${colorBackground};
  border-radius: ${borderRadius};
  box-shadow: none; /* bỏ đổ bóng để panel không nổi lên quá nhiều */
  z-index: 50;
  transition: all 0.3s ease; /* Transition mượt cho expanded state */

  /* Global styles cho tất cả buttons trong Container */
  button {
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    /* Giảm focus ring - nhỏ hơn và mềm hơn */
    &:focus,
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25) !important;
    }

    /* Active state mượt mà với scale nhẹ */
    &:active {
      transform: scale(0.92);
      transition: transform 0.1s ease;
    }

    /* Căn chỉnh icon tốt hơn - đảm bảo icon hiển thị đúng */
    [class^="icon-bbb-"],
    i[class^="icon-bbb-"],
    [class*="icon-bbb-chat"],
    [class*="icon-bbb-group_chat"],
    [class*="icon-bbb-note"],
    [class*="icon-bbb-message"],
    [class*="icon-bbb-comment"],
    i[class*="icon-bbb-chat"],
    i[class*="icon-bbb-group_chat"],
    i[class*="icon-bbb-note"],
    i[class*="icon-bbb-message"],
    i[class*="icon-bbb-comment"] {
      display: flex !important;
      align-items: center;
      justify-content: center;
      line-height: 1;
      margin: 0;
      position: relative;
      left: 50%;
      transform: translateX(-50%);
      visibility: visible !important;
      opacity: 1 !important;
      font-size: inherit;
    }
  }

  @media ${smallOnly} {
    bottom: calc(var(--actionbar-height, 70px) + 10px);
    left: 6px;
    right: 6px;
    gap: 10px;
    padding: 8px 10px;
  }

  @media ${hasPhoneWidth} {
    bottom: calc(var(--actionbar-height, 60px) + -1px);
    left: 22px;
    right: 22px;
    gap: 8px;
    padding: 0px 0px 8px;
  }
`;

const ToggleButtonWrapper = styled.div`
  /* Target vào icon bên trong toggle button */
  button {
    [class*="icon-bbb-right_arrow"],
    [class*="icon-bbb-left_arrow"],
    i[class*="icon-bbb-right_arrow"],
    i[class*="icon-bbb-left_arrow"] {
      position: relative !important;
      left: 50% !important;
      transform: translateX(-20%) !important;
    }
  }
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  /* Custom styles cho buttons trong LeftGroup */
  button {
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    /* Giảm focus ring */
    &:focus,
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3) !important;
    }

    /* Active state mượt mà */
    &:active {
      transform: scale(0.95);
      transition: transform 0.1s ease;
    }
  }
`;

const ExpandedButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fadeInSlide 0.3s ease;

  /* Tùy chỉnh riêng kích thước nút dấu cộng (actionsButton) cho nhỏ bằng các icon còn lại */
  button[data-test="actionsButton"] {
    min-width: 40px !important;
    min-height: 40px !important;
    width: 40px !important;
    height: 40px !important;
    max-width: 40px !important;
    max-height: 40px !important;
    padding: 0 !important;
    border-radius: 50% !important;

    /* Icon bên trong */
    [class^="icon-bbb-"],
    i[class^="icon-bbb-"] {
      font-size: 18px !important;
      left: 50%;
      transform: translateX(-50%);
    }
  }

  @keyframes fadeInSlide {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto; /* Đẩy nút chat sang bên phải */

  /* Custom styles cho buttons trong RightGroup */
  button {
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    /* Giảm focus ring */
    &:focus,
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3) !important;
    }

    /* Active state mượt mà */
    &:active {
      transform: scale(0.95);
      transition: transform 0.1s ease;
    }

    /* Căn chỉnh icon - đảm bảo icon hiển thị đúng */
    [class^="icon-bbb-"],
    i[class^="icon-bbb-"],
    [class*="icon-bbb-chat"],
    [class*="icon-bbb-group_chat"],
    [class*="icon-bbb-note"],
    [class*="icon-bbb-message"],
    [class*="icon-bbb-comment"],
    i[class*="icon-bbb-chat"],
    i[class*="icon-bbb-group_chat"],
    i[class*="icon-bbb-note"],
    i[class*="icon-bbb-message"],
    i[class*="icon-bbb-comment"] {
      display: flex !important;
      align-items: center;
      justify-content: center;
      line-height: 1;
      visibility: visible !important;
      opacity: 1 !important;
      font-size: inherit;
    }
  }
`;

const BadgeWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const UnreadBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background-color: ${colorDanger};
  color: ${colorWhite};
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  @media ${hasPhoneWidth} {
    top: -2px;
    right: -2px;
    min-width: 14px;
    height: 14px;
    font-size: 9px;
  }
`;

export default {
  Container,
  LeftGroup,
  RightGroup,
  BadgeWrapper,
  UnreadBadge,
  ExpandedButtons,
  ToggleButtonWrapper,
};

