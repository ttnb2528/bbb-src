import styled from "styled-components";
import {
  colorPrimary,
  colorGrayLight,
} from "/imports/ui/stylesheets/styled-components/palette";

export const SingleCheckSVG = styled.svg`
  color: ${colorGrayLight};
  opacity: 0.8;
  width: 16px;
  height: 16px;
  display: block;
`;

export const DoubleCheckSVG = styled.svg`
  color: ${colorPrimary};
  width: 16px;
  height: 16px;
  display: block;
`;

export const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: 6px;
  min-width: 16px;
  height: 16px;
  vertical-align: middle;
  flex-shrink: 0;
`;
