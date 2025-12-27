import styled from 'styled-components';
import {
  colorGrayLightest,
  colorOffWhite,
  colorText,
} from '/imports/ui/stylesheets/styled-components/palette';

interface ChatMessageProps {
  systemMsg?: boolean;
}

export const ChatMessage = styled.div<ChatMessageProps>`
  flex: 1;
  display: flex;
  flex-flow: row;
  flex-direction: column;
  color: #1f2937;
  word-break: break-word;
  font-size: 0.9375rem;
  line-height: 1.5;
  letter-spacing: -0.01em;

  & img {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
    margin: 0.5rem 0;
  }

  & p {
    margin: 0;
    white-space: pre-wrap;
    line-height: 1.5;
  }

  & code {
    white-space: pre-wrap;
    background-color: rgba(0, 0, 0, 0.08);
    border: none;
    border-radius: 4px;
    padding: 0.125rem 0.375rem;
    font-size: 0.875rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    color: #e11d48;
  }
  
  & h1 {
    font-size: 1.5em;
    margin: 0.5rem 0;
    font-weight: 700;
  }
  & h2 {
    font-size: 1.3em;
    margin: 0.5rem 0;
    font-weight: 700;
  }
  & h3 {
    font-size: 1.1em;
    margin: 0.5rem 0;
    font-weight: 600;
  }
  & h4 {
    margin: 0.5rem 0;
    font-weight: 600;
  }
  & h5 {
    margin: 0.5rem 0;
    font-weight: 600;
  }
  & h6 {
    margin: 0.5rem 0;
    font-weight: 600;
  }
  
  & a {
    color: #2563eb;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export default {
  ChatMessage,
};
