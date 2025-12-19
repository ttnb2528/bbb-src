import styled from 'styled-components';
import { colorWhite, colorGrayLight, colorPrimary, colorGrayDark } from '/imports/ui/stylesheets/styled-components/palette';
import { fontSizeBase, fontSizeSmall } from '/imports/ui/stylesheets/styled-components/typography';
import { smPaddingX, smPaddingY, borderSize } from '/imports/ui/stylesheets/styled-components/general';

interface ButtonProps {
  active?: boolean;
}

export const Panel = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 300px;
  display: flex;
  flex-direction: row;
  z-index: 10;
  background-color: ${colorWhite};
  border-left: ${borderSize} solid ${colorGrayLight};
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
`;

export const Buttons = styled.div`
  display: flex;
  flex-direction: column;
  width: 60px;
  background-color: ${colorGrayLight};
  padding: ${smPaddingY} 0;
  gap: ${smPaddingX};
`;

export const Button = styled.button<ButtonProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: ${smPaddingY} ${smPaddingX};
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ active }) => (active ? colorPrimary : colorGrayDark)};
  transition: all 0.2s;

  &:hover {
    background-color: ${({ active }) => (active ? 'transparent' : 'rgba(0, 0, 0, 0.05)')};
  }

  > [class^="icon-bbb-"] {
    font-size: ${fontSizeBase};
  }
`;

export const ButtonLabel = styled.span`
  font-size: ${fontSizeSmall};
  font-weight: 500;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  white-space: nowrap;
`;

export const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export default {
  Panel,
  Buttons,
  Button,
  ButtonLabel,
  Content,
};

