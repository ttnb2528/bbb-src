import styled from "styled-components";
import {
  colorGrayLight,
  colorGrayDark,
  colorPrimary,
  colorWhite,
} from "/imports/ui/stylesheets/styled-components/palette";
import {
  smPaddingX,
  smPaddingY,
  mdPaddingX,
  mdPaddingY,
  borderSize,
  borderRadius,
} from "/imports/ui/stylesheets/styled-components/general";

const ActionsList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 16px 24px 16px;
  gap: 8px;
  background: transparent;
`;

const ActionItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 16px;
  background-color: #f8fafc;
  border-radius: 14px;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 52px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);

  &:hover {
    background-color: #f1f5f9;
  }

  &:active {
    transform: scale(0.96);
    background-color: #e2e8f0;
  }
`;

const ActionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  margin-right: 12px;
  flex-shrink: 0;
  background: transparent;
  color: #64748b;

  i {
    font-size: 1.25rem;
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
  color: #334155;
  line-height: 1.5;
`;

const ActionDescription = styled.div`
  font-size: 13px;
  color: #64748b;
  opacity: 0.8;
  line-height: 1.3;
  margin-top: 2px;
`;

const Separator = styled.div`
  display: none;
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
