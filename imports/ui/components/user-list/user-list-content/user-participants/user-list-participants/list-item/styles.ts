import styled, { css, keyframes } from 'styled-components';

import {
  lgPaddingY,
  smPaddingY,
  borderSize,
  smPaddingX,
  userIndicatorsOffset,
  mdPaddingY,
  indicatorPadding,
} from '/imports/ui/stylesheets/styled-components/general';
import {
  listItemBgHover,
  itemFocusBorder,
  colorGray,
  colorGrayDark,
  colorPrimary,
  colorWhite,
  userListBg,
  colorSuccess,
  colorDanger,
  colorOffWhite,
} from '/imports/ui/stylesheets/styled-components/palette';

import Icon from '/imports/ui/components/common/icon/icon-ts/component';

interface AvatarProps {
    moderator?: boolean;
    presenter?: boolean;
    talking?: boolean;
    muted?: boolean;
    listenOnly?: boolean;
    voice?: boolean;
    noVoice?: boolean;
    color?: string;
    whiteboardAccess?: boolean;
    animations?: boolean;
    emoji?: boolean;
    avatar?: string;
    isChrome?: boolean;
    isFirefox?: boolean;
    isEdge?: boolean;
    isSkeleton?: boolean;
}

interface UserItemContentsProps {
  selected?: boolean;
  isActionsOpen?: boolean;
}

const UserItemContents = styled.div<UserItemContentsProps>`
  position: static;
  padding: .45rem;
  width: 100%;

  ${({ selected }) => selected && `
    background-color: ${listItemBgHover};
    border-top-left-radius: ${smPaddingY};
    border-bottom-left-radius: ${smPaddingY};

    &:focus {
      box-shadow: inset 0 0 0 ${borderSize} ${itemFocusBorder}, inset 1px 0 0 1px ${itemFocusBorder};
    }
  `}

  ${({ isActionsOpen }) => !isActionsOpen && `
    display: flex;
    flex-flow: row;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    cursor: pointer;

    [dir="rtl"] & {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
    }

    &:first-child {
      margin-top: 0;
    }
    &:focus,
    &:hover {
      outline: transparent;
      outline-style: dotted;
      outline-width: ${borderSize};
      background-color: ${listItemBgHover};
    }

    &:active{
      outline: transparent;
      outline-width: ${borderSize};
      outline-style: solid;
      background-color: ${listItemBgHover};
      box-shadow: inset 0 0 0 ${borderSize} ${itemFocusBorder}, inset 1px 0 0 1px ${itemFocusBorder};
    }
    flex-flow: column;
    flex-shrink: 0;
  `}

  ${({ isActionsOpen }) => isActionsOpen && `
    outline: transparent;
    outline-width: ${borderSize};
    outline-style: solid;
    background-color: ${listItemBgHover};
    box-shadow: inset 0 0 0 ${borderSize} ${itemFocusBorder}, inset 1px 0 0 1px ${itemFocusBorder};
    border-top-left-radius: ${smPaddingY};
    border-bottom-left-radius: ${smPaddingY};

    &:focus {
      outline-style: solid;
      outline-color: transparent !important;
    }
  `}

  flex-grow: 0;
  display: flex;
  flex-flow: row;
  border: 3px solid transparent;

  [dir="rtl"] & {
    padding: ${lgPaddingY} ${lgPaddingY} ${lgPaddingY} 0;
  }
`;

// ===== avatar =====

const Avatar = styled.div<AvatarProps>`
  position: relative;
  height: 2.75rem;
  width: 2.75rem;
  min-width: 2.75rem;
  border-radius: 50%;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 600;
  border: 2.5px solid ${colorWhite};
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: visible; /* Cho phép các indicator hiển thị ra ngoài */
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
  ${
  ({ color }) => css`
    background-color: ${color};
    background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
  `}
  }

  ${({ animations }) => animations && `
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease, .3s ease-in-out;
  `}
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08);
    transform: scale(1.05);
  }

  &:after,
  &:before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    padding-top: .5rem;
    padding-right: 0;
    padding-left: 0;
    padding-bottom: 0;
    color: inherit;
    top: auto;
    left: auto;
    bottom: ${userIndicatorsOffset};
    right: ${userIndicatorsOffset};
    border: 1.5px solid ${userListBg};
    border-radius: 50%;
    background-color: ${colorSuccess};
    color: ${colorWhite};
    opacity: 0;
    font-family: 'bbb-icons';
    font-size: .65rem;
    line-height: 0;
    text-align: center;
    vertical-align: middle;
    letter-spacing: -.65rem;
    z-index: 3; /* Đảm bảo indicator ở trên cùng */

    [dir="rtl"] & {
      left: ${userIndicatorsOffset};
      right: auto;
      padding-right: .65rem;
      padding-left: 0;
    }

    ${({ animations }) => animations && `
      transition: .3s ease-in-out;
    `}
  }

  ${({ moderator }) => moderator && `
    color: ${colorWhite} !important;
  `}

  ${({ presenter }) => presenter && `
    &:before {
      content: "\\00a0\\e90b\\00a0";
      padding: ${mdPaddingY} !important;
      opacity: 1 !important;
      top: ${userIndicatorsOffset};
      left: ${userIndicatorsOffset};
      bottom: auto;
      right: auto;
      border-radius: 5px;
      background-color: ${colorPrimary};
      z-index: 3 !important; /* Đảm bảo presenter indicator hiển thị */

      [dir="rtl"] & {
        left: auto;
        right: ${userIndicatorsOffset};
        letter-spacing: -.33rem;
      }
    }
  `}

  ${({
    presenter, isChrome, isFirefox, isEdge,
  }) => presenter && (isChrome || isFirefox || isEdge) && `
    &:before {
      padding: ${indicatorPadding} !important;
    }
  `}

  ${({ whiteboardAccess, presenter }) => whiteboardAccess && !presenter && `
    &:before {
      content: "\\00a0\\e925\\00a0";
      padding: ${mdPaddingY} !important;
      border-radius: 50% !important;
      opacity: 1;
      top: ${userIndicatorsOffset};
      left: ${userIndicatorsOffset};
      bottom: auto;
      right: auto;
      border-radius: 5px;
      background-color: ${colorPrimary};

      [dir="rtl"] & {
        left: auto;
        right: ${userIndicatorsOffset};
        letter-spacing: -.33rem;
        transform: scale(-1, 1);
      }
    }
  `}

  ${({
    whiteboardAccess, isChrome, isFirefox, isEdge,
  }) => whiteboardAccess && (isChrome || isFirefox || isEdge) && `
    &:before {
      padding: ${indicatorPadding};
    }
  `}

  // Audio indicator priority:
  // - muted/unmuted mic shown only when voice && !listenOnly
  // - noVoice only when !listenOnly
  // - listenOnly overrides everything else

  ${({ voice, muted, listenOnly }) => voice && !listenOnly && !muted && `
    &:after {
      content: "\\00a0\\e931\\00a0";
      background-color: ${colorSuccess};
      top: 1.375rem;
      left: 1.375rem;
      right: auto;
      bottom: auto;

      [dir="rtl"] & {
        left: auto;
        right: 1.375rem;
      }
      opacity: 1 !important;
      width: 1.2rem;
      height: 1.2rem;
      z-index: 3 !important; /* Đảm bảo voice indicator hiển thị */
    }
  `}

  ${({ voice, muted, listenOnly }) => voice && !listenOnly && muted && `
    &:after {
      content: "\\00a0\\e932\\00a0";
      background-color: ${colorDanger};
      opacity: 1 !important;
      width: 1.2rem;
      height: 1.2rem;
      bottom: auto;
      z-index: 3 !important; /* Đảm bảo muted indicator hiển thị */
    }
  `}

  ${({ listenOnly }) => listenOnly && `
    &:after {
      content: "\\00a0\\e90c\\00a0";
      opacity: 1 !important;
      width: 1.2rem;
      height: 1.2rem;
      background-color: ${colorSuccess};
      bottom: auto;
      z-index: 3 !important; /* Đảm bảo listenOnly indicator hiển thị */
    }
  `}

  ${({ noVoice, listenOnly }) => noVoice && !listenOnly && `
    &:after {
      content: "";
      background-color: ${colorOffWhite};
      top: 1.375rem;
      left: 1.375rem;
      right: auto;
      bottom: auto;

      [dir="rtl"] & {
        left: auto;
        right: 1.375rem;
      }

      opacity: 1 !important;
      width: 1.2rem;
      height: 1.2rem;
      z-index: 3 !important; /* Đảm bảo noVoice indicator hiển thị */
    }
  `}

  // ================ talking animation ================
  ${({ talking, animations, color }) => talking && animations && color && css`
    animation: ${pulse(color)} 1s infinite ease-in;
  `}

  ${({ talking, animations }) => talking && !animations && `
    box-shadow: 0 0 0 4px currentColor;
  `}
  // ================ talking animation ================
  // ================ image ================
  ${({ avatar, emoji }) => avatar?.length !== 0 && !emoji && css`
    background-image: url(${avatar});
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    border: 2.5px solid ${colorWhite};
  `}
  // ================ image ================

  // ================ content ================
  color: ${colorWhite} !important;
  font-size: 110%;
  text-transform: capitalize;
  display: flex;
  justify-content: center;
  align-items:center;  
  // ================ content ================

  & .react-loading-skeleton {    
    height: 2.75rem;
    width: 2.75rem;
    border-radius: 50%;
  }
`;

const Skeleton = styled.div`
 
`;

const UserAdditionalInformationIcon = styled(Icon)`
  margin-right: ${smPaddingX};
`;

const pulse = (color: string) => keyframes`
    0% {
      box-shadow: 0 0 0 0 ${color}80;
    }
    100% {
      box-shadow: 0 0 0 10px ${color}00;
    }
  }
`;

// ======================== User Name ========================

const UserNameContainer = styled.div`
  display: flex;
  flex-flow: column;
  min-width: 0;
  flex-grow: 1;
  margin: 0 0 0 ${smPaddingX};
  justify-content: center;
  font-size: 90%;
  max-width: 70%;

  [dir="rtl"]  & {
    margin: 0 ${smPaddingX} 0 0;
  }
`;

const UserName = styled.span`
  margin: 0;
  font-size: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  color: ${colorGrayDark};
  display: flex;
  flex-direction: row;

  > span {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  &.animationsEnabled {
    transition: all .3s;
  }`;

const UserNameSub = styled.span`
  margin: 0;
  font-size: 0.75rem;
  font-weight: 200;
  color: ${colorGray};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  i {
    line-height: 0;
    font-size: 75%;
  }
`;

// ======================== Icon Right Container ========================

const IconRightContainer = styled.div`
  margin: .25rem;  
`;

export default {
  Avatar,
  Skeleton,
  UserItemContents,
  UserNameContainer,
  UserAdditionalInformationIcon,
  UserNameSub,
  UserName,
  IconRightContainer,
};
