import styled, { css, keyframes } from "styled-components";
import {
  colorPrimary,
  listItemBgHover,
  itemFocusBorder,
  colorGray,
  colorWhite,
  colorGrayLightest,
  colorOffWhite,
  userListBg,
  colorSuccess,
  colorDanger,
} from "/imports/ui/stylesheets/styled-components/palette";
import {
  borderSize,
  smPaddingX,
  mdPaddingY,
  userIndicatorsOffset,
  indicatorPadding,
} from "/imports/ui/stylesheets/styled-components/general";
import { fontSizeBase } from "/imports/ui/stylesheets/styled-components/typography";
import { smallOnly } from "/imports/ui/stylesheets/styled-components/breakpoints";
import Button from "/imports/ui/components/common/button/component";
import { ScrollboxVertical } from "/imports/ui/stylesheets/styled-components/scrollable";

type ListItemProps = {
  animations: boolean;
};

type PanelProps = {
  isChrome: boolean;
};

type AvatarProps = {
  color: string;
  avatar: string;
  key: string;
  moderator: boolean;
  animations?: boolean;
  presenter?: boolean;
  whiteboardAccess?: boolean;
  voice?: boolean;
  muted?: boolean;
  listenOnly?: boolean;
  noVoice?: boolean;
  talking?: boolean;
  emoji?: string;
  isChrome?: boolean;
  isFirefox?: boolean;
  isEdge?: boolean;
};

const ListItem = styled.div<ListItemProps>`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;

  ${({ animations }) =>
    animations &&
    `
    transition: all .3s;
  `}

  &:first-child {
    margin-top: 0;
  }

  &:focus,
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    outline: none;
  }
`;

const UserContentContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  align-items: center;
  flex-direction: row;
`;

const UserAvatarContainer = styled.div`
  min-width: 2.75rem;
  margin: 0.5rem;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const UserName = styled.p`
  min-width: 0;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  margin: 0;
  margin-left: 0.5rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-self: flex-end;
  align-items: center;
  color: ${colorPrimary};
  & > button {
    padding: ${mdPaddingY};
    font-size: ${fontSizeBase};
    border-radius: 50%;
  }
`;
// @ts-ignore - Button is JS
const WaitingUsersButton = styled(Button)`
  font-weight: 600;
  color: #4caf50;

  &:focus,
  &:hover {
    background-color: rgba(76, 175, 80, 0.1) !important;
    color: #4caf50;
  }
`;
// @ts-ignore - Button is JS
const WaitingUsersButtonMsg = styled(Button)`
  font-weight: 600;
  color: #2196f3;

  &:after {
    font-family: "bbb-icons";
    content: "\\E910";
  }

  &:focus,
  &:hover {
    background-color: rgba(33, 150, 243, 0.1) !important;
    color: #2196f3;
  }
`;
// @ts-ignore - Button is JS
const WaitingUsersButtonDeny = styled(Button)`
  font-weight: 600;
  color: #f44336;

  &:focus,
  &:hover {
    background-color: rgba(244, 67, 54, 0.1) !important;
    color: #f44336;
  }
`;

const PendingUsers = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoPendingUsers = styled.p`
  text-align: center;
  font-weight: bold;
`;

const MainTitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  font-size: 0.85rem;
`;

const UsersWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Users = styled.div`
  display: flex;
  flex-direction: column;
`;
// @ts-ignore - Button is JS
const CustomButton = styled(Button)`
  width: 100%;
  padding: 0.85rem;
  margin: 0.4rem 0;
  font-weight: 600;
  font-size: ${fontSizeBase};
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 12px !important;
  border: none !important;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
    filter: brightness(1.1);
  }
`;

const Panel = styled.div<PanelProps>`
  background-color: #1a2233;
  color: white;
  padding: ${smPaddingX};
  display: flex;
  flex: 1 1 100%;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  height: 100%;
  min-height: 100vh;

  ${({ isChrome }) =>
    isChrome &&
    `
    transform: translateZ(0);
  `}

  @media ${smallOnly} {
    transform: none !important;
    min-height: 100%;
  }
`;

const LobbyMessage = styled.div`
  margin: 0.5rem 0.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;

  textarea {
    background-color: rgba(255, 255, 255, 0.07) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    box-shadow: none !important;

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    &:focus {
      border-color: rgba(255, 255, 255, 0.4) !important;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
    }
  }

  & > p {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    box-sizing: border-box;
    color: rgba(255, 255, 255, 0.8);
    padding: 1rem;
    text-align: center;
    font-size: 0.95rem;
  }
`;

const PrivateLobbyMessage = styled.div`
  display: none;
  margin-bottom: 1rem;

  textarea {
    background-color: rgba(255, 255, 255, 0.07) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    box-shadow: none !important;

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    &:focus {
      border-color: rgba(255, 255, 255, 0.4) !important;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
    }
  }

  & > p {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    box-sizing: border-box;
    color: rgba(255, 255, 255, 0.8);
    padding: 1rem;
    text-align: center;
    font-size: 0.95rem;
  }
`;

const RememberContainer = styled.div`
  margin: 1rem 1rem;
  height: 2rem;
  display: flex;
  align-items: center;
  & > label {
    height: fit-content;
    padding: 0;
    margin: 0;
    margin-left: 0.7rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;

    [dir="rtl"] & {
      margin: 0;
      margin-right: 0.7rem;
    }
  }
  & > input[type="checkbox"] {
    accent-color: #4caf50;
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }
`;

const ScrollableArea = styled(ScrollboxVertical)`
  overflow-y: auto;
  padding-right: 0.4rem;
  flex: 1;
  display: block;
`;

const ModeratorActions = styled.div`
  padding: 1rem 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
  flex-shrink: 0;
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

export default {
  ListItem,
  UserContentContainer,
  UserAvatarContainer,
  PrivateLobbyMessage,
  UserName,
  ButtonContainer,
  WaitingUsersButton,
  WaitingUsersButtonDeny,
  WaitingUsersButtonMsg,
  PendingUsers,
  NoPendingUsers,
  MainTitle,
  UsersWrapper,
  Users,
  CustomButton,
  Panel,
  LobbyMessage,
  RememberContainer,
  ScrollableArea,
  ModeratorActions,
  Avatar,
};
