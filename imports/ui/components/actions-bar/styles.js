import styled from 'styled-components';
import {
  smallOnly,
  hasPhoneWidth,
} from '/imports/ui/stylesheets/styled-components/breakpoints';
import {
  smPaddingX,
  smPaddingY,
  barsPadding,
  xsPadding,
  borderSize,
} from '/imports/ui/stylesheets/styled-components/general';
import {
  colorWhite,
  colorBackground,
  colorDanger,
  colorGrayLight,
  colorGrayDark,
} from '/imports/ui/stylesheets/styled-components/palette';
import {
  fontSizeBase,
  fontSizeSmall,
} from '/imports/ui/stylesheets/styled-components/typography';
import Button from '/imports/ui/components/common/button/component';

const ActionsBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 100%; /* Đảm bảo ActionsBar chiếm hết chiều cao của wrapper */

  @media ${smallOnly} {
    justify-content: center; /* Gom chung tất cả các group (Center, Right) vào giữa màn hình */
    gap: 8px; /* Tầm ảnh hưởng giữa Center list và Right list */
  }
`;

const ActionsBarWrapper = styled.section`
  flex: 1;
  padding: ${barsPadding};
  background-color: ${colorBackground};
  position: absolute; /* Giữ absolute để layout manager có thể điều khiển */
  order: 3;
  z-index: 1000 !important; /* Tăng z-index cao hơn để không bị che */
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2); /* Thêm shadow để tách biệt */
  overflow: visible; /* Đảm bảo không bị clip */
  padding-bottom: ${barsPadding}; /* Đảm bảo padding bottom đủ để không bị thụt */

  /* Protect controls when zooming: ensure minimum usable width */
  min-width: 320px; /* Minimum width to prevent controls from overflowing at 25% zoom */
  width: 100%; /* Full width by default */
  max-width: 100vw; /* Don't exceed viewport width */

  transition:
    transform 0.35s cubic-bezier(0.25, 1, 0.5, 1),
    opacity 0.35s ease;
  ${(props) => props.$isUIHidden
    && `
      transform: translateX(120vw) !important;
      opacity: 0;
      pointer-events: none;
    `}

  /* Mobile: tăng padding và min-height để buttons có không gian và không bị thụt */
  @media ${smallOnly} {
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    padding: 10px 16px 16px 16px; /* Tăng padding bottom thêm để không bị thụt */
    min-height: 75px !important; /* Tăng chiều cao tối thiểu lên 75px */
    min-width: 280px; /* Slightly smaller min-width on mobile */
  }

  @media ${hasPhoneWidth} {
    padding: 0px 10px 14px 10px !important; /* Tăng padding ngang để nút có khoảng thở */
    min-height: 72px !important; /* Tăng chiều cao tối thiểu lên 72px */
    min-width: 260px; /* Even smaller min-width on phone */
  }

  body.bbb-one-to-one-call &,
  &.bbb-oto-actions-bar {
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%);
    bottom: 16px !important;
    width: auto;
    min-width: 290px;
    max-width: calc(100vw - 28px);
    padding: 7px 12px !important;
    border-radius: 999px;
    border: none;
    background: rgba(14, 23, 35, 0.84);
    backdrop-filter: blur(12px);
    box-shadow: 0 12px 38px rgba(0, 0, 0, 0.45);

    .buttonWrapper {
      margin: 0 !important;
      padding: 0 !important;
    }

    .buttonWrapper[data-test="muteMicButton"],
    .buttonWrapper[data-test="unmuteMicButton"],
    .buttonWrapper[data-test="joinVideo"],
    .buttonWrapper[data-test="leaveVideo"],
    .buttonWrapper[data-test="leaveMeetingDropdown"] {
      margin: 0 5px !important;
      padding: 0 !important;
      min-width: 0 !important;
      min-height: 0 !important;
      width: auto !important;
      height: auto !important;
    }

    button {
      border: none !important;
      background: transparent !important;
      color: #ecf4ff !important;
      box-shadow: none !important;
      outline: none !important;
    }

    button > span {
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
    }

    button[data-test="audioDropdownMenu"],
    button[data-test="videoDropdownMenu"] {
      display: none !important;
    }

    span:has(> div > button[data-test="audioDropdownMenu"]),
    span:has(> div > button[data-test="videoDropdownMenu"]),
    span:has(> button[data-test="audioDropdownMenu"]),
    span:has(> button[data-test="videoDropdownMenu"]) {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    button[data-test="muteMicButton"] > span:first-of-type,
    button[data-test="unmuteMicButton"] > span:first-of-type,
    button[data-test="joinVideo"] > span:first-of-type,
    button[data-test="leaveVideo"] > span:first-of-type {
      width: 46px !important;
      height: 46px !important;
      border-radius: 50% !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: rgba(18, 31, 49, 0.88) !important;
      border: 1px solid rgba(171, 193, 223, 0.42) !important;
      color: #edf4ff !important;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.34) !important;
      transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        filter 0.18s ease !important;
    }

    .buttonWrapper[data-test="muteMicButton"]::before,
    .buttonWrapper[data-test="muteMicButton"]::after,
    .buttonWrapper[data-test="unmuteMicButton"]::before,
    .buttonWrapper[data-test="unmuteMicButton"]::after,
    .buttonWrapper[data-test="joinVideo"]::before,
    .buttonWrapper[data-test="joinVideo"]::after,
    .buttonWrapper[data-test="leaveVideo"]::before,
    .buttonWrapper[data-test="leaveVideo"]::after {
      content: none !important;
      display: none !important;
      animation: none !important;
      border: none !important;
      box-shadow: none !important;
    }

    button[data-test="muteMicButton"] > span:first-of-type::before,
    button[data-test="muteMicButton"] > span:first-of-type::after,
    button[data-test="unmuteMicButton"] > span:first-of-type::before,
    button[data-test="unmuteMicButton"] > span:first-of-type::after,
    button[data-test="joinVideo"] > span:first-of-type::before,
    button[data-test="joinVideo"] > span:first-of-type::after,
    button[data-test="leaveVideo"] > span:first-of-type::before,
    button[data-test="leaveVideo"] > span:first-of-type::after {
      content: none !important;
      display: none !important;
    }

    button[data-test="muteMicButton"] i,
    button[data-test="unmuteMicButton"] i,
    button[data-test="joinVideo"] i,
    button[data-test="leaveVideo"] i,
    [data-test="leaveMeetingDropdown"] i {
      font-size: 19px !important;
      line-height: 1 !important;
    }

    button[data-test="muteMicButton"]:hover > span:first-of-type,
    button[data-test="unmuteMicButton"]:hover > span:first-of-type,
    button[data-test="joinVideo"]:hover > span:first-of-type,
    button[data-test="leaveVideo"]:hover > span:first-of-type {
      transform: translateY(-1px) !important;
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.4) !important;
      filter: brightness(1.08) !important;
    }

    button[data-test="muteMicButton"] > span:first-of-type {
      background: linear-gradient(
        135deg,
        rgba(35, 116, 255, 0.95),
        rgba(66, 150, 255, 0.95)
      ) !important;
      border-color: rgba(149, 203, 255, 0.55) !important;
      color: #ffffff !important;
    }

    button[data-test="leaveVideo"] > span:first-of-type {
      background: linear-gradient(
        135deg,
        rgba(255, 79, 79, 0.96),
        rgba(255, 122, 122, 0.96)
      ) !important;
      border-color: rgba(255, 176, 176, 0.62) !important;
      color: #fff !important;
    }

    button:focus,
    button:focus-visible,
    button:active {
      outline: none !important;
      box-shadow: none !important;
    }

    [data-test="leaveMeetingDropdown"] > span,
    [data-test="leaveMeetingDropdown"] {
      background: linear-gradient(
        135deg,
        rgba(255, 74, 74, 0.95),
        rgba(255, 120, 120, 0.95)
      ) !important;
      border: none !important;
      color: #fff !important;
    }

    [data-test="leaveMeetingDropdown"] > span {
      width: 46px !important;
      height: 46px !important;
      border-radius: 50% !important;
      box-shadow: 0 10px 24px rgba(182, 26, 26, 0.45) !important;
    }
  }

  @media ${smallOnly} {
    body.bbb-one-to-one-call &,
    &.bbb-oto-actions-bar {
      min-width: 0;
      width: calc(100vw - 20px);
      border-radius: 18px;
      padding: 8px 10px 12px !important;
      bottom: 8px !important;
      left: 50% !important;
      right: auto !important;
      transform: translateX(-50%);
    }
  }
`;

const Left = styled.div`
  display: inherit;
  flex: 0;
  > *:not(span) {
    @media ${smallOnly} {
      margin: 0 ${smPaddingY};
    }
  }
  @media ${smallOnly} {
    bottom: ${smPaddingX};
    left: ${smPaddingX};
    right: auto;
    [dir="rtl"] & {
      left: auto;
      right: ${smPaddingX};
    }
  }

  /* Mobile: ẩn một số phần không cần thiết */
  @media ${hasPhoneWidth} {
    flex: 0 0 auto;
    min-width: 0;
  }
`;

const Center = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px; /* Giảm gap để gọn gàng hơn, giống Google Meet */
  flex: 1;
  justify-content: center;
  align-items: center;
  min-width: 0; /* Allow flex shrinking */
  flex-shrink: 1; /* Allow shrinking when needed */

  /* Desktop: gap hợp lý, không quá rộng */
  @media (min-width: 1024px) {
    gap: 10px;
  }

  /* Đảm bảo buttons có kích thước đồng nhất */
  button {
    flex-shrink: 0;
  }

  /* Mobile: gap vừa phải, không quá rộng - giống Google Meet */
  @media ${smallOnly} {
    gap: 8px; /* Giảm gap để gọn gàng hơn */
    flex: 0 0 auto; /* KHÔNG TRẢI RỘNG trên mobile để không làm vỡ khoảng cách với Right Group */
    justify-content: center;
    overflow: visible; /* Bỏ auto để không bị cắt xén (clip) nút bé do margin hoạc border box-shadow */

    /* Buttons trên mobile - kích thước hợp lý */
    button {
      min-width: 40px !important;
      min-height: 40px !important;
      width: 40px !important;
      height: 40px !important;
      flex-shrink: 0 !important;
    }

    /* Tách riêng nút arrow dropdown (AudioDropdown) - nhỏ hơn các nút khác */
    button[data-test="audioDropdownMenu"],
    button[aria-label*="Change audio device"],
    button[aria-label*="audio device"] {
      min-width: 20px !important;
      min-height: 20px !important;
      width: 20px !important;
      height: 20px !important;
      flex-shrink: 0 !important;
    }
  }

  @media ${hasPhoneWidth} {
    gap: 8px; /* Tối ưu khoang cách trên iPhone SE */
    height: 62px !important;

    /* Buttons trên phone */
    button {
      min-width: 44px !important;
      min-height: 44px !important;
      width: 44px !important;
      height: 44px !important;
      flex-shrink: 0 !important;
    }
  }
`;

const Right = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  gap: 8px; /* Gap hợp lý, giống Google Meet */

  [dir="rtl"] & {
    right: auto;
    left: ${smPaddingX};
  }

  @media (min-width: 1024px) {
    gap: 10px;
  }

  @media ${smallOnly} {
    right: 0;
    left: 0;
    display: contents;
  }

  /* Mobile: gap hợp lý cho Right section - giống Google Meet */
  @media ${smallOnly} {
    gap: 10px; /* Tăng gap nhẹ để nút không dính nhau */

    /* Buttons trên mobile */
    button {
      min-width: 40px !important;
      min-height: 40px !important;
      width: 40px !important;
      height: 40px !important;
      flex-shrink: 0 !important;
    }

    /* Tách riêng nút arrow dropdown (AudioDropdown) - nhỏ hơn các nút khác */
    button[data-test="audioDropdownMenu"],
    button[aria-label*="Change audio device"],
    button[aria-label*="audio device"] {
      min-width: 20px !important;
      min-height: 20px !important;
      width: 20px !important;
      height: 20px !important;
      flex-shrink: 0 !important;
    }
  }

  @media ${hasPhoneWidth} {
    gap: 8px;

    /* Buttons trên phone */
    button {
      min-width: 44px !important;
      min-height: 44px !important;
      width: 44px !important;
      height: 44px !important;
      flex-shrink: 0 !important;
    }
  }
`;

const RaiseHandButton = styled(Button)`
  ${({ ghost }) => ghost
    && `
    & > span {
      box-shadow: none;
      background-color: transparent !important;
      border-color: ${colorWhite} !important;
    }
  `}
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  > * {
    margin: 8px;
  }
`;

const ReactionsDropdown = styled.div`
  position: relative;
`;

const Wrapper = styled.div`
  overflow: hidden;
  margin: 0.2em 0.2em 0.2em 0.2em;
  text-align: center;
  max-height: 270px;
  width: 270px;
  em-emoji {
    cursor: pointer;
  }
`;

const Separator = styled.div`
  height: 2.5rem;
  width: 0;
  border: 1px solid ${colorWhite};
  align-self: center;
  opacity: 0.75;
  margin: 0 ${smPaddingX};

  /* Mobile: ẩn separator trên phone */
  @media ${hasPhoneWidth} {
    display: none;
  }
`;

const Gap = styled.div`
  display: flex;
  flex-wrap: wrap; /* Allow wrapping when zoomed to prevent overflow */
  gap: 10px;
  align-items: center;
  min-width: 0; /* Allow flex shrinking */
  flex-shrink: 0; /* Prevent shrinking */

  /* Mobile: gap hợp lý - giống Google Meet */
  @media ${smallOnly} {
    gap: 10px; /* Tăng gap nhẹ cho nhóm nút bên phải */
  }

  @media ${hasPhoneWidth} {
    gap: 8px; /* Tăng gap trên phone để 2 nút ngoài cùng tách nhau hơn */
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
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 10px;
  background-color: ${colorDanger};
  color: ${colorWhite};
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

const ChatNotesTabs = styled.div`
  display: flex;
  border-bottom: ${borderSize} solid ${colorGrayLight};
  background-color: ${colorWhite};
  flex-shrink: 0;
`;

const TabButton = styled.button`
  flex: 1;
  padding: ${smPaddingY} ${smPaddingX};
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-size: ${fontSizeBase};
  font-weight: 600;
  color: ${colorGrayDark};
  cursor: pointer;
  transition: all 0.2s ease;

  &[data-active="true"] {
    color: ${colorDanger};
    border-bottom-color: ${colorDanger};
    background-color: ${colorGrayLight};
  }

  &:hover {
    background-color: ${colorGrayLight};
  }
`;

const RoomInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${smPaddingX};

  /* Mobile: giảm gap và ẩn một số phần */
  @media ${smallOnly} {
    gap: 4px;
  }

  @media ${hasPhoneWidth} {
    gap: 2px;
    display: none; /* Ẩn RoomInfo trên mobile để giải phóng không gian */
  }
`;

const Time = styled.span`
  font-weight: 400;
  color: ${colorWhite};
  font-size: ${fontSizeBase};
  white-space: nowrap;

  @media ${smallOnly} {
    font-size: ${fontSizeSmall};
  }

  @media ${hasPhoneWidth} {
    font-size: 11px;
  }
`;

const RoomName = styled.h1`
  font-weight: 400;
  color: ${colorWhite};
  font-size: ${fontSizeBase};
  margin: 0;
  padding: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  > [class^="icon-bbb-"] {
    font-size: 75%;
  }

  & span i {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    font-size: 0.75rem;
  }

  &:hover {
    opacity: 0.8;
  }

  /* Mobile: giảm font size và max-width */
  @media ${smallOnly} {
    font-size: ${fontSizeSmall};
    max-width: 120px;
  }

  @media ${hasPhoneWidth} {
    font-size: 11px;
    max-width: 80px;

    /* Ẩn icon dropdown trên phone */
    > [class^="icon-bbb-"] {
      display: none;
    }
  }
`;

export default {
  ActionsBar,
  Left,
  Center,
  Right,
  RaiseHandButton,
  ButtonContainer,
  ReactionsDropdown,
  Wrapper,
  ActionsBarWrapper,
  Gap,
  Separator,
  RoomInfo,
  RoomName,
  BadgeWrapper,
  UnreadBadge,
  ChatNotesTabs,
  TabButton,
  Time,
};
