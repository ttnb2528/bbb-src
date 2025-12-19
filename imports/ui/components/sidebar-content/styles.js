import styled from 'styled-components';
import { colorWhite, colorGrayLight } from '/imports/ui/stylesheets/styled-components/palette';
import {
  borderSize,
  navbarHeight,
  smPaddingX,
  borderRadius,
  xsPadding,
  smPaddingY,
} from '/imports/ui/stylesheets/styled-components/general';
import { smallOnly, mediumUp } from '/imports/ui/stylesheets/styled-components/breakpoints';

const SidebarContentWrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${colorWhite};
  border-radius: ${borderRadius} ${borderRadius} 0 0;
  border: ${borderSize} solid ${colorGrayLight};
  border-bottom: none;
  border-left: none; // No left border since it's adjacent to User List panel
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative; /* Needed for absolute TabBar on the right */
`;

// Tab bar for switching between Chat and Notes
const TabBar = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 68px;
  display: flex;
  flex-direction: column;
  gap: ${xsPadding};
  padding: ${smPaddingY} ${xsPadding};
  border-left: ${borderSize} solid ${colorGrayLight};
  background: ${colorWhite};
`;

const TabButton = styled.button`
  appearance: none;
  border: ${borderSize} solid ${colorGrayLight};
  border-radius: ${borderRadius};
  background: ${(props) => (props['data-active'] ? colorGrayLight : colorWhite)};
  padding: ${smPaddingY} ${xsPadding};
  min-height: 64px;
  width: 100%;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

// Wrapper to keep nav items (Chat list, Notes button)
const TabNavContent = styled.div`
  display: none; /* Hide legacy list to save space; we use tab buttons */
`;

// Area to render selected content
const ContentArea = styled.div`
  flex: 1;
  overflow: auto;
  padding: 0 ${smPaddingX} ${smPaddingY} ${smPaddingX};
  /* Leave room for right-side TabBar */
  padding-right: calc(68px + ${smPaddingX});
  display: flex;
  flex-direction: column;
  gap: ${smPaddingY};
`;

const Poll = styled.div`
  position: absolute;
  display: flex;
  flex-flow: column;
  overflow-y: auto;
  overflow-x: hidden;
  outline: transparent;
  outline-width: ${borderSize};
  outline-style: solid;
  order: 2;
  height: 100%;
  background-color: ${colorWhite};
  min-width: 20em;
  padding: ${smPaddingX};

  @media ${smallOnly} {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 5;
    height: auto;
    top: ${navbarHeight};
    overflow: auto;
     &.no-padding {
      padding: 0;
    }
  }

  @media ${mediumUp} {
    position: relative;
    order: 1;
  }
`;

export default {
  SidebarContentWrapper,
  TabBar,
  TabButton,
  TabNavContent,
  ContentArea,
  Poll,
};
