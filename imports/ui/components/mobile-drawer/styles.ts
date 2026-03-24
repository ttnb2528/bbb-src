import styled, { css } from "styled-components";
import { colorWhite } from "/imports/ui/stylesheets/styled-components/palette";

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

const Drawer = styled.div<{ $position: "left" | "right" | "bottom" }>`
  position: fixed;
  background-color: ${colorWhite};
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);

  ${({ $position }) =>
    $position === "left" &&
    css`
      top: 0;
      bottom: 0;
      left: 0;
      width: 85vw;
      max-width: 400px;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
      animation: slideInFromLeft 0.3s ease;
    `}

  ${({ $position }) =>
    $position === "right" &&
    css`
      top: 0;
      bottom: 0;
      right: 0;
      width: 85vw;
      max-width: 400px;
      animation: slideInFromRight 0.3s ease;
    `}

  ${({ $position }) =>
    $position === "bottom" &&
    css`
      bottom: 15px;
      left: 12px;
      right: 12px;
      width: calc(100% - 24px);
      max-height: 90vh;
      border-radius: 24px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      animation: slideInFromBottom 0.3s ease;

      &::before {
        content: "";
        display: block;
        width: 40px;
        height: 5px;
        background-color: #e2e8f0;
        border-radius: 10px;
        margin: 12px auto 4px auto;
      }
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
  padding: 8px 16px 4px 16px;
  flex-shrink: 0;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #334155;
  margin: 0;
  padding: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #64748b;
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
    background-color: #f1f5f9;
  }

  &:active {
    background-color: #e2e8f0;
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
