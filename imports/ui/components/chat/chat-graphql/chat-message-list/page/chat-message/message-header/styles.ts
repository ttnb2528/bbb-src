import styled from 'styled-components';

import {
  colorHeading,
  colorGrayLight,
  colorGrayDark,
} from '/imports/ui/stylesheets/styled-components/palette';
import { fontSizeSmaller, lineHeightComputed } from '/imports/ui/stylesheets/styled-components/typography';

interface ChatUserNameProps {
  currentlyInMeeting: boolean;
}

export const HeaderContent = styled.div`
  display: flex;
  flex-flow: row;
  align-items: center;
  width: 100%;
`;

export const ChatUserName = styled.div<ChatUserNameProps>`
  display: flex;
  min-width: 0;
  font-weight: 600;
  position: relative;
  font-size: 0.9375rem;
  line-height: 1.4;

  margin-right: 0.5rem;

  min-width: 0;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;

  ${({ currentlyInMeeting }) => currentlyInMeeting && `
    color: #1a1a1a;
  `}

  ${({ currentlyInMeeting }) => !currentlyInMeeting && `
    color: #6b7280;
    text-transform: capitalize;
    font-style: italic;
    font-weight: 500;

    & > span {
      text-align: right;
      padding: 0 .1rem 0 0;

      [dir="rtl"] & {
        text-align: left;
        padding: 0 0 0 .1rem;
      }
    }
  `}
`;

export const ChatUserOffline = styled.span`
  color: ${colorGrayLight};
  font-weight: 100;
  text-transform: lowercase;
  font-style: italic;
  font-size: 85%;
  line-height: 1;
  user-select: none;
  margin-right: calc(${lineHeightComputed} / 2);
`;

export const ChatTime = styled.time`
  flex-shrink: 0;
  flex-grow: 0;
  flex-basis: max-content;
  color: #9ca3af;
  text-transform: none;
  font-size: 0.75rem;
  font-weight: 400;
  margin-left: 0.375rem;
  opacity: 0.7;
  [dir='rtl'] & {
    margin: 0 0.375rem 0 0;
  }

  & > span {
    vertical-align: baseline;
  }
`;

export const ChatHeaderText = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 0.25rem;
  gap: 0.375rem;
`;

export const EditLabel = styled.span`
  color: ${colorGrayLight};
  font-size: ${fontSizeSmaller};
  display: flex;
  align-items: center;
  gap: calc(${lineHeightComputed} / 4);

  [dir='ltr'] & {
    margin-right: calc(${lineHeightComputed} / 2);
  }

  [dir='rtl'] & {
    margin-left: calc(${lineHeightComputed} / 2);
  }
`;

export const Center = styled.div`
  flex-grow: 1;
`;

export default {
  HeaderContent,
  ChatTime,
  ChatUserOffline,
  ChatUserName,
  ChatHeaderText,
  EditLabel,
  Center,
};
