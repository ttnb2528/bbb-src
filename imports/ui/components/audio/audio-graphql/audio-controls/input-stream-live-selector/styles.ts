/* eslint-disable @typescript-eslint/ban-ts-comment */
import styled, { css, keyframes } from "styled-components";
import ButtonEmoji from "/imports/ui/components/common/button/button-emoji/ButtonEmoji";
import Button from "/imports/ui/components/common/button/component";
import {
  colorPrimary,
  colorDanger,
  colorGrayDark,
  colorOffWhite,
  colorWhite,
  colorSuccess,
} from "/imports/ui/stylesheets/styled-components/palette";
import {
  smPaddingY,
  smPadding,
} from "/imports/ui/stylesheets/styled-components/general";
import { smallOnly } from "/imports/ui/stylesheets/styled-components/breakpoints";

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 white;
  }
  70% {
    box-shadow: 0 0 0 0.5625rem transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
`;

// @ts-ignore - as button comes from JS, we can't provide its props
export const MuteToggleButton = styled(Button)`
  ${({ ghost }) =>
    ghost &&
    `
    span {
      box-shadow: none;
      background-color: transparent !important;
      border-color: ${colorWhite} !important;
    }
  `}

  ${({ $talking }) =>
    $talking &&
    `
    border-radius: 50%;
  `}

  ${({ $talking, animations }) =>
    $talking &&
    animations &&
    css`
      animation: ${pulse} 1s infinite ease-in;
    `}

  ${({ $talking, animations }) =>
    $talking &&
    !animations &&
    css`
      & span {
        content: "";
        outline: none !important;
        background-clip: padding-box;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.5);
      }
    `}
  
      @media ${smallOnly} {
    margin-right: 0 !important; /* Xoá margin để nhường chỗ cho absolute arrow */
  }

  [dir="rtl"] & {
    margin-right: 0;
    margin-left: 0;

    @media ${smallOnly} {
      margin-left: 0 !important;
    }
  }
`;

export const DisabledLabel = {
  color: colorGrayDark,
  fontWeight: "bold",
  opacity: 1,
  fontSize: "1rem",
};

export const AudioSettingsOption = {
  paddingLeft: 12,
};

export const SelectedLabel = {
  color: colorPrimary,
  backgroundColor: colorOffWhite,
  fontWeight: "bold",
  paddingLeft: "2.6rem",
};

export const DeviceLabel = {
  paddingLeft: "2.6rem",
};

export const SelectedLabelIcon = {
  color: colorSuccess,
  fontSize: "1.2rem",
};

export const DangerColor = {
  color: colorDanger,
  paddingLeft: 12,
};

// @ts-ignore - as button comes from JS, we can't provide its props
export const AudioDropdown = styled(ButtonEmoji)`
  /* Gắn mũi tên trực tiếp vào góc phải dưới của mic button */
  @media ${smallOnly} {
    position: absolute !important;
    bottom: 0px !important;
    right: 0px !important;
    transform: translate(30%, 30%) !important;
    min-width: 18px !important;
    min-height: 18px !important;
    width: 18px !important;
    height: 18px !important;
    border-radius: 50% !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
    z-index: 10 !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  span {
    display: flex;
    align-items: center;
    justify-content: center;
    i {
      /* Desktop */
      width: 10px !important;
      bottom: 1px;

      /* Mobile */
      @media ${smallOnly} {
        width: auto !important;
        font-size: 0.65rem !important;
        position: static !important;
        transform: translateY(1px) !important;
      }
    }
  }
`;

export default {
  MuteToggleButton,
  DisabledLabel,
  DeviceLabel,
  SelectedLabel,
  SelectedLabelIcon,
  AudioSettingsOption,
  DangerColor,
  AudioDropdown,
};
