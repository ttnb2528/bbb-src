import styled, { css } from 'styled-components';

import {
  userIndicatorsOffset,
  smPaddingX,
  smPaddingY,
  lgPadding,
  $3xlPadding,
  xlPadding,
  mdPadding,
} from '/imports/ui/stylesheets/styled-components/general';
import {
  fontSizeBase,
  fontSizeSmaller,
} from '/imports/ui/stylesheets/styled-components/typography';

import {
  colorWhite,
  userListBg,
  colorSuccess,
  colorBlueLightest,
  colorGrayLight,
  colorGrayLightest,
  colorGrayDark,
  emphasizedMessageBackgroundColor,
  highlightedMessageBorderColor,
} from '/imports/ui/stylesheets/styled-components/palette';

import Header from '/imports/ui/components/common/control-header/component';
import { ChatTime as ChatTimeBase } from './message-header/styles';

interface ChatWrapperProps {
  sameSender: boolean;
  isSystemSender: boolean;
  isPresentationUpload?: boolean;
  isCustomPluginMessage: boolean;
}

interface ChatContentProps {
  sameSender: boolean;
  isCustomPluginMessage: boolean;
  $isSystemSender: boolean;
  $editing: boolean;
  $highlight: boolean;
  $reactionPopoverIsOpen: boolean;
  $keyboardFocused: boolean;
  $emphasizedMessage: boolean;
}

interface ChatAvatarProps {
  avatar: string;
  color: string;
  moderator: boolean;
  emoji?: string;
}

export const FlexColumn = styled.div`
  display: flex;
  flex-flow: column;
  gap: ${smPaddingY};
`;

export const ChatWrapper = styled.div<ChatWrapperProps>`
  pointer-events: auto;
  display: flex;
  flex-flow: column;
  gap: ${smPaddingY};
  position: relative;
  font-size: ${fontSizeBase};
  position: relative;

  [dir='rtl'] & {
    direction: rtl;
  }

  ${({ isPresentationUpload }) => isPresentationUpload && `
      border-left: 2px solid #0F70D7;
      margin-top: 1rem;
      padding: 0.5rem;
      word-break: break-word;
      background-color: #F3F6F9;
    `}
  ${({ isSystemSender }) => isSystemSender && `
    background-color: #fef9f1;
    border-left: 2px solid #f5c67f;
    border-radius: 0px 3px 3px 0px;
    padding: 8px 2px;
  `}
  ${({ isCustomPluginMessage }) => isCustomPluginMessage && `
    margin: 0;
    padding: 0;
  `}
`;

export const ChatContent = styled.div<ChatContentProps>`
  display: flex;
  flex-flow: column;
  width: 100%;
  border-radius: 12px;
  position: relative;
  border: none;
  padding: 0.5rem 0.875rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  background-color: #f0f2f5;
  margin-left: 0;

  ${({ $isSystemSender }) => !$isSystemSender && `
    background-color: #f0f2f5;
  `}
  
  ${({ $isSystemSender }) => $isSystemSender && `
    background-color: transparent;
    padding: 0.375rem 0.75rem;
  `}
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }

  ${({ $highlight }) => $highlight && `
    &:hover {
      background-color: rgba(0, 123, 255, 0.08);
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
    }
  `}

  ${({
    $editing, $reactionPopoverIsOpen, $keyboardFocused,
  }) => ($reactionPopoverIsOpen || $editing || $keyboardFocused)
    && `
    background-color: ${colorBlueLightest} !important;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  `}

  .chat-message-container:focus & {
    background-color: ${colorBlueLightest} !important;
  }

  ${({ $emphasizedMessage }) => $emphasizedMessage && `
    background-color: ${emphasizedMessageBackgroundColor};
    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
  `}
`;

export const ChatContentFooter = styled.div`
  justify-content: flex-end;
  gap: 0.25rem;
  position: absolute;
  bottom: 0.25rem;
  line-height: 1;
  font-size: 95%;
  display: flex;
  background-color: inherit;
  border-radius: 0.5rem;

  [dir="rtl"] & {
    left: 0.25rem;
  }

  [dir="ltr"] & {
    right: 0.25rem;
  }
`;

export const ChatHeader = styled(Header)`
  ${({ isRTL }) => isRTL && `
    padding-left: ${smPaddingX};
  `}

  ${({ isRTL }) => !isRTL && `
    padding-right: ${smPaddingX};
  `}
`;

export const ChatAvatar = styled.div<ChatAvatarProps>`
  flex: 0 0 2.75rem;
  margin: 0;
  box-flex: 0;
  position: relative;
  height: 2.75rem;
  width: 2.75rem;
  border-radius: 50%;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 600;
  border: 2.5px solid ${colorWhite};
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
  overflow: hidden;
  ${({ color }) => css`
    background-color: ${color};
    background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
  `}
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08);
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
    z-index: 1;

    [dir="rtl"] & {
      left: ${userIndicatorsOffset};
      right: auto;
      padding-right: .65rem;
      padding-left: 0;
    }
  }
  
  // ================ image ================
  ${({ avatar, emoji, color }) => avatar?.length !== 0 && !emoji && css`
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
  align-items: center;
  // ================ content ================

  & .react-loading-skeleton {
    height: 2.75rem;
    width: 2.75rem;
    border-radius: 50%;
  }
`;

export const Container = styled.div<{ $sequence: number }>`
  display: flex;
  flex-direction: column;
  user-select: text;
  outline: none;
  margin-bottom: 1rem;
  padding: 0.25rem 0;

  &:not(:first-of-type) {
    margin-top: 0;
  }

  &[data-focusable="false"] {
    pointer-events: none;
  }
`;

export const MessageItemWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 0;
  gap: 0.625rem;
  align-items: flex-start;
  position: relative;
  
  &:hover {
    .chat-message-avatar {
      transform: scale(1.05);
    }
  }
`;

export const DeleteMessage = styled.span`
  color: ${colorGrayLight};
  padding: ${mdPadding} ${xlPadding};
  border: 1px solid ${colorGrayLightest};
  border-radius: 0.375rem;
`;

export const ChatHeading = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

export const EditLabel = styled.span`
  color: ${colorGrayLight};
  font-style: italic;
  font-size: 75%;
  display: flex;
  align-items: center;
  gap: 0.125rem;
  line-height: 1;
`;

export const ChatTime = styled(ChatTimeBase)`
  font-style: italic;
  color: ${colorGrayDark};
  display: none;

  .chat-message-container:focus &,
  .chat-message-container-keyboard-focused &,
  .chat-message-content:hover & {
    display: flex;
  }
`;
