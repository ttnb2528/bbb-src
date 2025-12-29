import styled from 'styled-components';
import { colorWhite, colorPrimary } from '/imports/ui/stylesheets/styled-components/palette';
import { smallOnly } from '/imports/ui/stylesheets/styled-components/breakpoints';
import { smPaddingX, smPaddingY } from '/imports/ui/stylesheets/styled-components/general';

interface ChatProps {
  isChrome: boolean;
  isRTL: boolean;
}

export const Chat = styled.div<ChatProps>`
  background-color: ${colorWhite};
  padding: 0.75rem;
  display: flex;
  flex: 1 1 0%;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  min-height: 0;
  height: 100%;
  user-select: none;
  gap: 0.5rem;

  a {
    color: ${colorPrimary};
    text-decoration: none;

    &:focus {
      color: ${colorPrimary};
      text-decoration: underline;
    }
    &:hover {
      filter: brightness(90%);
      text-decoration: underline;
    }
    &:active {
      filter: brightness(85%);
      text-decoration: underline;
    }
    &:hover:focus {
      filter: brightness(90%);
      text-decoration: underline;
    }
    &:focus:active {
      filter: brightness(85%);
      text-decoration: underline;
    }
  }
  u {
    text-decoration-line: none;
  }

  ${({ isChrome }) => isChrome && `
    transform: translateZ(0);
  `}

  @media ${smallOnly} {
    transform: none !important;
  }
`;

const ChatContent = styled.div`
  height: 100%;
  display: contents;
`;

const ChatMessages = styled.div`
  user-select: text;
`;

export default { Chat, ChatMessages, ChatContent };
