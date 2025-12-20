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
`;

const ActionsBarWrapper = styled.section`
  flex: 1;
  padding: ${barsPadding};
  background-color: ${colorBackground};
  position: relative;
  order: 3;

  /* Mobile: giảm padding */
  @media ${smallOnly} {
    padding: ${xsPadding} ${smPaddingX};
  }

  @media ${hasPhoneWidth} {
    padding: 4px ${xsPadding};
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
  gap: 12px; /* Tăng gap để buttons không dính nhau */
  flex: 1;
  justify-content: center;
  align-items: center;

  /* Desktop: gap hợp lý */
  @media (min-width: 1024px) {
    gap: 16px;
  }

  /* Mobile: giảm gap nhưng vẫn đủ để không dính */
  @media ${smallOnly} {
    gap: 8px;
    flex: 1;
    justify-content: center;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }

    /* Buttons trên mobile */
    button {
      min-width: 40px !important;
      min-height: 40px !important;
      width: 40px !important;
      height: 40px !important;
    }
  }

  @media ${hasPhoneWidth} {
    gap: 6px; /* Tăng từ 2px lên 6px để không dính */

    /* Buttons trên phone */
    button {
      min-width: 36px !important;
      min-height: 36px !important;
      width: 36px !important;
      height: 36px !important;
    }
  }
`;

const Right = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  position: relative;
  gap: 12px; /* Tăng gap để buttons không dính nhau */

  [dir="rtl"] & {
    right: auto;
    left: ${smPaddingX};
  }

  @media (min-width: 1024px) {
    gap: 16px;
  }

  @media ${smallOnly} {
    right: 0;
    left: 0;
    display: contents;
  }

  /* Mobile: gap hợp lý */
  @media ${smallOnly} {
    gap: 8px;

    /* Buttons trên mobile */
    button {
      min-width: 40px !important;
      min-height: 40px !important;
      width: 40px !important;
      height: 40px !important;
    }
  }

  @media ${hasPhoneWidth} {
    gap: 6px; /* Tăng từ 2px lên 6px để không dính */

    /* Buttons trên phone */
    button {
      min-width: 36px !important;
      min-height: 36px !important;
      width: 36px !important;
      height: 36px !important;
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
  gap: .5rem;
  align-items: center;

  /* Mobile: giảm gap */
  @media ${smallOnly} {
    gap: 4px;
  }

  @media ${hasPhoneWidth} {
    gap: 2px;
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
};
