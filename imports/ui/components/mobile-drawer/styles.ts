import styled, { css } from 'styled-components';
import { colorWhite, colorGrayLight, colorGrayDark } from '/imports/ui/stylesheets/styled-components/palette';
import { fontSizeLarge } from '/imports/ui/stylesheets/styled-components/typography';
import { smPaddingX, smPaddingY, borderSize } from '/imports/ui/stylesheets/styled-components/general';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Drawer = styled.div<{ $position: 'left' | 'right' | 'bottom' }>`
  position: fixed;
  background-color: ${colorWhite};
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);

  ${({ $position }) => $position === 'left' && css`
    top: 0;
    bottom: 0;
    left: 0;
    width: 85vw;
    max-width: 400px;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
    animation: slideInFromLeft 0.3s ease;
  `}

  ${({ $position }) => $position === 'right' && css`
    top: 0;
    bottom: 0;
    right: 0;
    width: 85vw;
    max-width: 400px;
    animation: slideInFromRight 0.3s ease;
  `}

  ${({ $position }) => $position === 'bottom' && css`
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    max-height: 80vh;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
    animation: slideInFromBottom 0.3s ease;
  `}

  @keyframes slideInFromLeft {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slideInFromBottom {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${smPaddingY} ${smPaddingX};
  border-bottom: ${borderSize} solid ${colorGrayLight};
  flex-shrink: 0;
`;

const Title = styled.h2`
  font-size: ${fontSizeLarge};
  font-weight: 600;
  color: ${colorGrayDark};
  margin: 0;
  padding: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${colorGrayDark};
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${colorGrayLight};
  }

  &:active {
    background-color: ${colorGrayLight};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
`;

export default {
  Overlay,
  Drawer,
  Header,
  Title,
  CloseButton,
  Content,
};

