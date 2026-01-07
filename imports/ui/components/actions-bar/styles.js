import styled from 'styled-components';
import { smallOnly, hasPhoneWidth } from '/imports/ui/stylesheets/styled-components/breakpoints';
import { smPaddingX, smPaddingY, barsPadding, xsPadding, borderSize } from '/imports/ui/stylesheets/styled-components/general';
import { colorWhite, colorBackground, colorDanger, colorGrayLight, colorGrayDark } from '/imports/ui/stylesheets/styled-components/palette';
import { fontSizeBase, fontSizeSmall } from '/imports/ui/stylesheets/styled-components/typography';
import Button from '/imports/ui/components/common/button/component';

const ActionsBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 100%; /* Đảm bảo ActionsBar chiếm hết chiều cao của wrapper */
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

  /* Mobile: tăng padding và min-height để buttons có không gian và không bị thụt */
  @media ${smallOnly} {
    padding: 10px 16px 16px 16px; /* Tăng padding bottom thêm để không bị thụt */
    min-height: 75px !important; /* Tăng chiều cao tối thiểu lên 75px */
    min-width: 280px; /* Slightly smaller min-width on mobile */
  }

  @media ${hasPhoneWidth} {
    padding: 0px 10px 14px 10px !important; /* Tăng padding ngang để nút có khoảng thở */
    min-height: 72px !important; /* Tăng chiều cao tối thiểu lên 72px */
    min-width: 260px; /* Even smaller min-width on phone */
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
    flex: 1;
    justify-content: center;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }

    /* Buttons trên mobile - kích thước hợp lý */
    button {
      min-width: 40px !important;
      min-height: 40px !important;
      width: 40px !important;
      height: 40px !important;
      flex-shrink: 0 !important;
    }
  }

  @media ${hasPhoneWidth} {
    gap: 12px; /* Giảm gap trên phone để gọn gàng hơn */
    height: 62px !important;

    /* Buttons trên phone */
    button {
      min-width: 48px !important;
      min-height: 48px !important;
      width: 48px !important;
      height: 48px !important;
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
  }

  @media ${hasPhoneWidth} {
    gap: 8px; /* Tăng gap cho 2 nút ngoài cùng bên phải */

    /* Buttons trên phone */
    button {
      min-width: 48px !important;
      min-height: 48px !important;
      width: 48px !important;
      height: 48px !important;
      flex-shrink: 0 !important;
    }
  }
`;

const RaiseHandButton = styled(Button)`
  ${({ ghost }) => ghost && `
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
  opacity: .75;
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
    margin-left: .5rem;
    margin-right: .5rem;
    font-size: .75rem;
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
