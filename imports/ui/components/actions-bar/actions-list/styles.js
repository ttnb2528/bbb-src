import styled from 'styled-components';
import { colorGrayLight, colorGrayDark, colorPrimary, colorWhite } from '/imports/ui/stylesheets/styled-components/palette';
import { smPaddingX, smPaddingY, mdPaddingX, mdPaddingY, borderSize, borderRadius } from '/imports/ui/stylesheets/styled-components/general';

const ActionsList = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${mdPaddingY} 0;
  background: ${colorWhite};
`;

const ActionItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: ${mdPaddingY} ${mdPaddingX};
  background: ${colorWhite};
  border: none;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #fafafa;
  }

  &:active {
    background-color: #f5f5f5;
  }
`;

const ActionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-right: ${mdPaddingX};
  flex-shrink: 0;
  background: #f8f9fa;
  border-radius: 10px;
  color: ${colorGrayDark};

  i {
    font-size: 22px;
  }
`;

const ActionContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  justify-content: center;
`;

const ActionLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #212529;
  line-height: 1.5;
  letter-spacing: -0.01em;
`;

const ActionDescription = styled.div`
  font-size: 13px;
  color: ${colorGrayDark};
  opacity: 0.65;
  line-height: 1.3;
`;

const Separator = styled.div`
  height: 1px;
  background: #f0f0f0;
  margin: ${smPaddingY} ${mdPaddingX};
`;

const EmptyState = styled.div`
  padding: ${mdPaddingY} ${mdPaddingX};
  text-align: center;
  color: ${colorGrayDark};
  opacity: 0.6;
  font-size: 14px;
`;

export default {
  ActionsList,
  ActionItem,
  ActionIcon,
  ActionContent,
  ActionLabel,
  ActionDescription,
  Separator,
  EmptyState,
};
