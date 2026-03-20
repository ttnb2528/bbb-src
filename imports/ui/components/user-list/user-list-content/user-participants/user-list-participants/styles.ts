import styled, { css, keyframes } from "styled-components";
import {
  userIndicatorsOffset,
  mdPaddingY,
  indicatorPadding,
} from "/imports/ui/stylesheets/styled-components/general";
import {
  colorPrimary,
  colorWhite,
  userListBg,
  colorSuccess,
  colorDanger,
  colorOffWhite,
} from "/imports/ui/stylesheets/styled-components/palette";

import { ScrollboxVertical } from "/imports/ui/stylesheets/styled-components/scrollable";

interface AvatarProps {
  color: string;
  animations?: boolean;
  moderator?: boolean;
  presenter?: boolean;
  isChrome?: boolean;
  isFirefox?: boolean;
  isEdge?: boolean;
  whiteboardAccess?: boolean;
  voice?: boolean;
  muted?: boolean;
  listenOnly?: boolean;
  noVoice?: boolean;
  avatar: string;
  emoji: string;
  talking?: boolean;
}

const Avatar = styled.div<AvatarProps>`
  position: relative;
  height: 2.25rem;
  width: 2.25rem;
  border-radius: 50%;
  text-align: center;
  font-size: .85rem;
  border: 2px solid transparent;
  user-select: none;
  ${({ color }) => css`
    background-color: ${color};
  `}
  }

  ${({ animations }) =>
    animations &&
    `
    transition: .3s ease-in-out;
  `}

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
    z-index: 1;

    [dir="rtl"] & {
      left: ${userIndicatorsOffset};
      right: auto;
      padding-right: .65rem;
      padding-left: 0;
    }

    ${({ animations }) =>
      animations &&
      `
      transition: .3s ease-in-out;
    `}
  }

  ${({ moderator }) =>
    moderator &&
    `
    border-radius: 5px;
  `}

  ${({ presenter }) =>
    presenter &&
    `
    &:before {
      content: "\\00a0\\e90b\\00a0";
      padding: ${mdPaddingY} !important;
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
      }
    }
  `}

  ${({ presenter, isChrome, isFirefox, isEdge }) =>
    presenter &&
    (isChrome || isFirefox || isEdge) &&
    `
    &:before {
      padding: ${indicatorPadding} !important;
    }
  `}

  ${({ whiteboardAccess, presenter }) =>
    whiteboardAccess &&
    !presenter &&
    `
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

  ${({ whiteboardAccess, isChrome, isFirefox, isEdge }) =>
    whiteboardAccess &&
    (isChrome || isFirefox || isEdge) &&
    `
    &:before {
      padding: ${indicatorPadding};
    }
  `}

  ${({ voice }) =>
    voice &&
    `
    &:after {
      content: "\\00a0\\e931\\00a0";
      background-color: ${colorSuccess};
      top: 1.375rem;
      left: 1.375rem;
      right: auto;

      [dir="rtl"] & {
        left: auto;
        right: 1.375rem;
      }
      opacity: 1;
      width: 1.2rem;
      height: 1.2rem;
    }
  `}

  ${({ muted }) =>
    muted &&
    `
    &:after {
      content: "\\00a0\\e932\\00a0";
      background-color: ${colorDanger};
      opacity: 1;
      width: 1.2rem;
      height: 1.2rem;
    }
  `}

  ${({ listenOnly }) =>
    listenOnly &&
    `
    &:after {
      content: "\\00a0\\e90c\\00a0";
      opacity: 1;
      width: 1.2rem;
      height: 1.2rem;
    }
  `}

  ${({ noVoice }) =>
    noVoice &&
    `
    &:after {
      content: "";
      background-color: ${colorOffWhite};
      top: 1.375rem;
      left: 1.375rem;
      right: auto;

      [dir="rtl"] & {
        left: auto;
        right: 1.375rem;
      }

      opacity: 1;
      width: 1.2rem;
      height: 1.2rem;
    }
  `}

  // ================ talking animation ================
  ${({ talking, animations, color }) =>
    talking &&
    animations &&
    css`
      animation: ${pulse(color)} 1s infinite ease-in;
    `}
  // ================ talking animation ================
  // ================ image ================
  ${({ avatar, emoji }) =>
    avatar.length !== 0 &&
    !emoji &&
    css`
      background-image: url(${avatar});
      background-repeat: no-repeat;
      background-size: contain;
    `}
  // ================ image ================

  // ================ content ================
  color: ${colorWhite};
  font-size: 110%;
  text-transform: capitalize;
  display: flex;
  justify-content: center;
  align-items:center;  
  // ================ content ================
`;

const Skeleton = styled.div`
  & .react-loading-skeleton {
    height: 2.25rem;
    width: 2.25rem;
  }
`;

const UserListColumn = styled.div`
  display: flex;
  flex-flow: column;
  min-height: 0;
  flex-grow: 1;
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

const VirtualizedList = styled(ScrollboxVertical)`
  background: transparent !important;

  outline: none;
  overflow-x: hidden;
  list-style-type: none;
  margin: 0;
  padding: 0;
`;

const UserListItem = styled.li`
  padding: 0.25em 0;
  margin-left: 0.5rem;
`;

const SearchWrapper = styled.div`
  padding: 8px 16px;
  position: relative;
  display: flex;
  align-items: center;

  i {
    position: absolute;
    left: 26px;
    color: ${colorWhite};
    opacity: 0.6;
    font-size: 14px;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 8px 12px 8px 32px;
  color: ${colorWhite};
  font-size: 0.9rem;
  transition: all 0.2s;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    background-color: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

export default {
  Avatar,
  Skeleton,
  UserListColumn,
  VirtualizedList,
  UserListItem,
  SearchWrapper,
  SearchInput,
};
