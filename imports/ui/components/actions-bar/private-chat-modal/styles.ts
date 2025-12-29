import styled from 'styled-components';
import { colorWhite, colorGrayLight, colorGrayDark, colorDanger } from '/imports/ui/stylesheets/styled-components/palette';
import { fontSizeBase, fontSizeLarge } from '/imports/ui/stylesheets/styled-components/typography';
import { smPaddingX, smPaddingY, borderSize } from '/imports/ui/stylesheets/styled-components/general';
import { smallOnly, hasPhoneWidth } from '/imports/ui/stylesheets/styled-components/breakpoints';

const Modal = styled.div<{ $minimized: boolean }>`
  display: flex;
  flex-direction: column;
  width: ${({ $minimized }) => ($minimized ? '56px' : '900px')};
  max-width: 95vw;
  height: ${({ $minimized }) => ($minimized ? '56px' : '70vh')};
  max-height: ${({ $minimized }) => ($minimized ? '56px' : '650px')};
  min-height: ${({ $minimized }) => ($minimized ? '56px' : 'auto')};
  background-color: ${colorWhite};
  border-radius: ${({ $minimized }) => ($minimized ? '50%' : '8px')};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: ${({ $minimized }) => ($minimized ? 'visible' : 'hidden')};
  transition: width 0.3s ease, height 0.3s ease, border-radius 0.3s ease;
  position: relative;
  ${({ $minimized }) => $minimized && `
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  `}

  /* Mobile responsive */
  @media ${smallOnly} {
    width: ${({ $minimized }) => ($minimized ? '48px' : '100vw')};
    height: ${({ $minimized }) => ($minimized ? '48px' : '100vh')};
    max-width: ${({ $minimized }) => ($minimized ? '48px' : '100vw')};
    max-height: ${({ $minimized }) => ($minimized ? '48px' : '100vh')};
    min-height: ${({ $minimized }) => ($minimized ? '48px' : '100vh')};
    border-radius: ${({ $minimized }) => ($minimized ? '50%' : '0')};
  }

  @media ${hasPhoneWidth} {
    width: ${({ $minimized }) => ($minimized ? '44px' : '100vw')};
    height: ${({ $minimized }) => ($minimized ? '44px' : '100vh')};
    max-width: ${({ $minimized }) => ($minimized ? '44px' : '100vw')};
    max-height: ${({ $minimized }) => ($minimized ? '44px' : '100vh')};
    min-height: ${({ $minimized }) => ($minimized ? '44px' : '100vh')};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${smPaddingY} ${smPaddingX};
  border-bottom: ${borderSize} solid ${colorGrayLight};
  flex-shrink: 0; /* Prevent header from shrinking */
`;

const TabBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${smPaddingX};
  padding: 6px ${smPaddingX};
  border-bottom: ${borderSize} solid ${colorGrayLight};
  flex-shrink: 0;
`;

const TabButton = styled.button<{ 'data-active'?: boolean }>`
  border: none;
  background: transparent;
  padding: 6px 10px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  color: ${({ 'data-active': active }) => (active ? colorGrayDark : '#777')};
  background-color: ${({ 'data-active': active }) => (active ? 'rgba(0,0,0,0.05)' : 'transparent')};

  &:hover {
    background-color: rgba(0,0,0,0.06);
  }
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: ${smPaddingX};
  font-size: ${fontSizeLarge};
  font-weight: 600;
  color: ${colorGrayDark};
  cursor: move;

  > [class^="icon-bbb-"] {
    font-size: ${fontSizeBase};
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0; /* Prevent flex item from overflowing */
  max-width: 100%; /* Prevent from exceeding container */
  display: flex;
  flex-direction: row;
  overflow: hidden;

  /* Mobile: stack vertically */
  @media ${smallOnly} {
    flex-direction: column;
  }
`;

const LeftPane = styled.div`
  flex: 0 0 260px;
  min-width: 0; /* Prevent flex item from overflowing */
  max-width: 260px; /* Fixed width */
  border-right: ${borderSize} solid ${colorGrayLight};
  padding: ${smPaddingY} ${smPaddingX};
  overflow-y: auto;

  /* Mobile: full width, border bottom instead of right */
  @media ${smallOnly} {
    flex: 0 0 auto;
    max-width: 100%;
    width: 100%;
    border-right: none;
    border-bottom: ${borderSize} solid ${colorGrayLight};
    max-height: 40vh;
  }
`;

const RightPane = styled.div`
  flex: 1;
  min-width: 0; /* Prevent flex item from overflowing */
  max-width: 100%; /* Prevent from exceeding container */
  padding: ${smPaddingY} 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  /* Fix input chat không b? to ra */
  > * {
    min-width: 0;
    max-width: 100%;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${smPaddingX};

  /* Mobile: smaller gap */
  @media ${smallOnly} {
    gap: 4px;
  }
`;

const MinimizedClose = styled.button`
  position: absolute;
  top: -5px;
  right: 0px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  z-index: 10;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
  opacity: 0;
  visibility: hidden;

  &:hover {
    transform: scale(1.15);
  }

  &:active {
    transform: scale(0.95);
  }

  > [class^="icon-bbb-"] {
    font-size: 14px;
    color: ${colorDanger};
    line-height: 1;
    font-weight: 900;
    text-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
    filter: drop-shadow(0 0 1px rgba(220, 53, 69, 0.3));
  }
`;

const MinimizedIcon = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  > [class^="icon-bbb-"] {
    font-size: 22px;
    color: ${colorGrayDark};
  }

  /* Hi?n th? nút X khi hover vào icon */
  &:hover button {
    opacity: 1;
    visibility: visible;
  }
`;

export default {
  Modal,
  Header,
  Title,
  Content,
  LeftPane,
  RightPane,
  HeaderActions,
  MinimizedIcon,
  MinimizedClose,
  TabBar,
  TabButton,
};

