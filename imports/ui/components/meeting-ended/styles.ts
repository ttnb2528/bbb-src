import { smallOnly } from '/imports/ui/stylesheets/styled-components/breakpoints';
import styled, { css } from 'styled-components';

import {
  borderRadius,
  lgPaddingX,
} from '/imports/ui/stylesheets/styled-components/general';
import {
  fontSizeSmall,
  fontSizeBase,
  fontSizeLarge,
  headingsFontWeight,
  lineHeightComputed,
} from '/imports/ui/stylesheets/styled-components/typography';
import {
  colorWhite,
  colorText,
  colorBackground,
} from '/imports/ui/stylesheets/styled-components/palette';

type OvcarProps = {
  $ovcarAuction?: boolean;
};

const ovcarFontNav = css`
  font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
`;

const ovcarFontDisplay = css`
  font-family: Lexend, "Plus Jakarta Sans", system-ui, sans-serif;
`;

const Parent = styled.div<OvcarProps>`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${colorBackground};

  ${({ $ovcarAuction }) => $ovcarAuction && css`
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(225, 6, 0, 0.28) 0%, transparent 55%),
      linear-gradient(180deg, #1a0a0a 0%, #080808 55%, #050505 100%);
    ${ovcarFontNav};
    -webkit-font-smoothing: antialiased;
  `}
`;

const Modal = styled.div<OvcarProps>`
  display: flex;
  padding: ${lgPaddingX};
  background-color: ${colorWhite};
  flex-direction: column;
  border-radius: ${borderRadius};
  max-width: 95vw;
  width: 600px;

  ${({ $ovcarAuction }) => $ovcarAuction && css`
    width: min(400px, calc(100vw - 32px));
    padding: 28px 24px 24px;
    border-radius: 16px;
    background: rgba(20, 22, 28, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    color: #fff;
  `}
`;

const Content = styled.div`
  text-align: center;
`;

const Title = styled.h1<OvcarProps>`
  margin: 0;
  font-size: ${fontSizeLarge};
  font-weight: ${headingsFontWeight};

  ${({ $ovcarAuction }) => $ovcarAuction && css`
    ${ovcarFontDisplay};
    font-size: 1.375rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #fff;
    line-height: 1.25;
  `}
`;

const Text = styled.div<OvcarProps>`
  color: ${colorText};
  font-weight: normal;
  padding: ${lineHeightComputed} 0;

  @media ${smallOnly} {
    font-size: ${fontSizeSmall};
  }

  ${({ $ovcarAuction }) => $ovcarAuction && css`
    ${ovcarFontNav};
    color: rgba(255, 255, 255, 0.72);
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.45;
    padding: 12px 0 20px;
  `}
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const MeetingEndedButton = styled.button<OvcarProps>`
  border: none;
  overflow: visible;
  border-radius: 2px;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  height: 3rem;
  display: flex !important;
  align-items: center;
  box-align: center;
  flex-align: center;
  box-pack: center;
  justify-content: center;
  flex-pack: center;
  color: var(--btn-primary-color, var(--color-white, #FFF));
  background-color: var(--btn-primary-bg, var(--color-primary, #6366F1)); /* Indigo */
  border: 3px solid transparent;
  padding: calc(1.25rem / 2);
  @media ${smallOnly} {
    font-size: ${fontSizeBase};
  }

  ${({ $ovcarAuction }) => $ovcarAuction && css`
    ${ovcarFontNav};
    width: 100%;
    height: 44px;
    border-radius: 10px;
    border: none;
    padding: 0 16px;
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    color: #fff;
    background: linear-gradient(135deg, #e10600 0%, #b00000 100%);
    box-shadow: 0 8px 24px rgba(225, 6, 0, 0.28);
    transition: opacity 0.15s ease;

    &:hover {
      opacity: 0.92;
    }

    &:active {
      opacity: 0.85;
    }
  `}
`;

const TextArea = styled.textarea`
  resize: none;
  margin: 1rem auto;
  width: 100%;

  &::placeholder {
    text-align: center;
  }
`;

export default {
  Parent,
  Modal,
  Content,
  Title,
  Text,
  MeetingEndedButton,
  TextArea,
  Wrapper,
};
