import styled from 'styled-components';
import {
  colorGrayLightest,
  colorGrayDark,
  colorPrimary,
} from '/imports/ui/stylesheets/styled-components/palette';
import Button from '/imports/ui/components/common/button/component';
import { smPadding } from '/imports/ui/stylesheets/styled-components/general';

const WelcomeMessage = styled.div`
  font-size: 1.0rem;
  line-height: 1.6;
  margin-bottom: 1.25rem;
  color: ${colorGrayDark};
  
  &:empty {
    display: none;
  }

  p {
    margin: 0 0 0.75rem 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  a {
    color: ${colorPrimary};
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s ease;

    &:hover {
      color: ${colorPrimary};
      text-decoration: underline;
    }
  }
`;

const Container = styled.div<{ isFullWidth: boolean }>`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  gap: 1.5rem;

  & > div {
    flex: ${({ isFullWidth }) => (isFullWidth ? '1 1 100%' : '1 1 calc(50% - 0.75rem)')};
    box-sizing: border-box;
    padding: ${({ isFullWidth }) => (isFullWidth ? '0' : '0 1rem')};
    overflow: auto;
    overflow-wrap: break-word;
    min-width: 0;
  }

  & div p {
    margin: 0.5rem 0;
    line-height: 1.5;
    word-break: break-word;
  }

  ${({ isFullWidth }) => !isFullWidth && `
    &::before {
      content: '';
      position: absolute;
      height: 50%;
      left: 50%;
      width: 1px;
      background-color: ${colorGrayLightest};
      transform: translateX(-50%);
    }
  `}

  & a {
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
`;

const JoinTitle = styled.h2`
  font-size: 0.875rem;
  text-transform: uppercase;
  color: ${colorGrayDark};
  font-weight: 600;
  letter-spacing: 0.5px;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// @ts-ignore - as button comes from JS, we can't provide its props
export const CopyButton = styled(Button)`
  color: ${colorPrimary};
  
  [dir='ltr'] & {
    margin-left: ${smPadding};
  }

  [dir='rtl'] & {
    margin-right: ${smPadding};
  }
`;

export const Chevron = styled.div`
  position: absolute;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid white;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
`;

export default {
  WelcomeMessage,
  Container,
  JoinTitle,
  CopyButton,
  Chevron,
};
