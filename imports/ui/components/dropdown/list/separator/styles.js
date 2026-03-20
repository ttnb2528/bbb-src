import styled from "styled-components";
import { colorGrayLighter } from "/imports/ui/stylesheets/styled-components/palette";
import { lineHeightComputed } from "/imports/ui/stylesheets/styled-components/typography";

const Separator = styled.li`
  display: flex;
  flex: 1 1 100%;
  height: 1px;
  min-height: 1px;
  background-color: rgba(255, 255, 255, 0.15);
  padding: 0;
  margin-top: calc(${lineHeightComputed} * 0.5);
  margin-bottom: calc(${lineHeightComputed} * 0.5);
`;

export default {
  Separator,
};
