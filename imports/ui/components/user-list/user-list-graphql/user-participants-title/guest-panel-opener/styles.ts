import styled from "styled-components";

import {
  smPaddingX,
  lgPaddingY,
  borderSize,
  mdPaddingY,
  mdPaddingX,
} from "/imports/ui/stylesheets/styled-components/general";
import {
  colorPrimary,
  userListBg,
  colorWhite,
  listItemBgHover,
  itemFocusBorder,
  unreadMessagesBg,
  colorGray,
  colorGrayDark,
  colorOffWhite,
  colorGrayLight,
} from "/imports/ui/stylesheets/styled-components/palette";
import { ScrollboxVertical } from "/imports/ui/stylesheets/styled-components/scrollable";
import { fontSizeSmall } from "/imports/ui/stylesheets/styled-components/typography";

const Messages = styled.div`
  flex-grow: 0;
  display: flex;
  flex-flow: column;
  flex-shrink: 0;
  max-height: 30vh;
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${lgPaddingY};
  margin-top: ${smPaddingX};
`;

const SmallTitle = styled.h2`
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0 ${smPaddingX};
  color: ${colorGray};
  flex: 1;
  margin: 0;
`;

const ScrollableList = styled(ScrollboxVertical)`
  background: transparent;

  outline: none;

  &:hover {
    outline: transparent;
    outline-style: dotted;
    outline-width: ${borderSize};
  }

  &:focus,
  &:active {
    border-radius: none;
    box-shadow: inset 0 0 1px ${colorPrimary};
    outline-style: transparent;
  }

  overflow-x: hidden;
  padding-top: 1px;
  padding-right: 1px;
`;

const List = styled.div`
  margin: 0 0 1px ${mdPaddingY};

  [dir="rtl"] & {
    margin: 0 ${mdPaddingY} 1px 0;
  }
`;

const ListItem = styled.div`
  display: flex;
  flex-flow: row;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  cursor: pointer;

  [dir="rtl"] & {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
  }

  &:first-child {
    margin-top: 0;
  }

  &:hover {
    outline: transparent;
    outline-style: dotted;
    outline-width: ${borderSize};
    background-color: rgba(255, 255, 255, 0.12);
  }

  &:active,
  &:focus {
    outline: transparent;
    outline-width: ${borderSize};
    outline-style: solid;
    background-color: rgba(255, 255, 255, 0.12);
    box-shadow: inset 0 0 0 ${borderSize} rgba(255, 255, 255, 0.3);
  }

  align-items: center;
  cursor: pointer;
  display: flex;
  flex-flow: row;
  flex-grow: 0;
  flex-shrink: 0;
  padding-top: ${lgPaddingY};
  padding-bottom: ${lgPaddingY};
  padding-left: ${lgPaddingY};
  text-decoration: none;
  width: 100%;
  color: white;
  background-color: rgba(255, 255, 255, 0.07);
  border-radius: 8px;

  [dir="rtl"] & {
    padding-right: ${lgPaddingY};
    padding-left: 0;
  }

  > i {
    display: flex;
    font-size: 175%;
    color: ${colorGrayLight};
    flex: 0 0 2.2rem;
    margin-right: ${smPaddingX};
    [dir="rtl"] & {
      margin-right: 0;
      margin-left: ${smPaddingX};
    }
  }

  > span {
    font-weight: 600;
    font-size: ${fontSizeSmall};
    color: white;
    position: relative;
    flex-grow: 1;
    line-height: 2;
    text-align: left;
    padding-left: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    [dir="rtl"] & {
      text-align: right;
      padding-right: ${mdPaddingX};
    }
  }

  div {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:active {
    background-color: ${listItemBgHover};
    box-shadow:
      inset 0 0 0 ${borderSize} ${itemFocusBorder},
      inset 1px 0 0 1px ${itemFocusBorder};
  }
`;

const UnreadMessages = styled.div`
  display: flex;
  flex-flow: column;
  justify-content: center;
  margin-left: auto;
  [dir="rtl"] & {
    margin-right: auto;
    margin-left: 0;
  }
`;

const UnreadMessagesText = styled.div`
  display: flex;
  flex-flow: column;
  margin: 0;
  justify-content: center;
  align-items: center;
  color: ${colorWhite};
  line-height: 1;
  padding: 0.2rem 0.5rem;
  text-align: center;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  background-color: ${unreadMessagesBg};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

export default {
  Messages,
  Container,
  SmallTitle,
  ScrollableList,
  List,
  ListItem,
  UnreadMessages,
  UnreadMessagesText,
};
