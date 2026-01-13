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
  flex-direction: column;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  box-sizing: border-box;
  text-align: left;
  gap: 0.75rem;
`;

const Section = styled.div`
  padding: 0.9rem 1.1rem;
  border-radius: 0.6rem;
  background: #ffffff;
  box-sizing: border-box;
`;

const LinkText = styled.div`
  font-size: 0.8rem;
  line-height: 1.5;
  word-break: break-all;
  margin-bottom: 0.4rem;

  a {
    color: ${colorPrimary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: ${colorGrayDark};
  opacity: 0.85;
  line-height: 1.4;
`;

const JoinTitle = styled.h2`
  font-size: 0.8rem;
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
  Section,
  LinkText,
  Description,
  JoinTitle,
  CopyButton,
  Chevron,
};
