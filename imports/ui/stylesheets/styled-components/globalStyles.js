import { createGlobalStyle } from 'styled-components';
import { smallOnly } from '/imports/ui/stylesheets/styled-components/breakpoints';
import {
  smPaddingX,
  borderRadius,
  borderSize,
  borderSizeSmall,
} from '/imports/ui/stylesheets/styled-components/general';
import {
  dropdownBg,
  colorText,
  colorWhite,
  colorGrayLighter,
  colorOverlay,
} from '/imports/ui/stylesheets/styled-components/palette';

const GlobalStyle = createGlobalStyle`
  // BBBMenu
  @media ${smallOnly} {
    .MuiPopover-root {
      top: 0 !important;
    }
    .MuiPaper-root-mobile {
      top: 0 !important;
      left: 0 !important;
      bottom: 0 !important;
      right: 0 !important;
      max-width: none !important;
    }
    .MuiPaper-root {
      width: 100%;
    }
  }
  .MuiList-padding {
    padding: 0 !important;
  }
  .MuiPaper-root {
    background-color: ${dropdownBg};
    border-radius: ${borderRadius};
    border: 0;
    z-index: 999;
    max-width: 22rem;
  }

  /* Options dropdown (id=app-settings-dropdown-menu) - giữ menu nằm gọn trên footer */
  #app-settings-dropdown-menu .MuiPaper-root {
    @media (min-width: 768px) {
      top: auto !important;          /* Bỏ top mặc định */
      bottom: 72px !important;       /* Gần footer hơn nhưng vẫn có khoảng thở */
      transform-origin: bottom right !important;
      transition: transform 0.18s ease-out, opacity 0.18s ease-out;
    }
  }

  // modal
  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  .modalOverlay {
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${colorOverlay};
  }

  .fullscreenModalOverlay {
    z-index: 900;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  // Private Chat Modal - Bỏ hoàn toàn overlay đen và blur
  .PrivateChatModal__overlay {
    z-index: 1000;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    /* Bỏ hoàn toàn nền đen mờ phía sau popup */
    background-color: transparent !important;
    backdrop-filter: none !important;
    pointer-events: none;
  }
  
  /* Mobile: fullscreen từ top-left */
  @media (max-width: 640px) {
    .PrivateChatModal__overlay {
      align-items: flex-start !important;
      justify-content: flex-start !important;
    }
  }
  
  /* Override ReactModal default styles cho PrivateChatModal */
  .PrivateChatModal__overlay.ReactModal__Overlay--after-open {
    background-color: transparent !important;
    backdrop-filter: none !important;
  }
  
  /* Chỉ content có thể click được */
  .PrivateChatModal__overlay .PrivateChatModal__content {
    pointer-events: auto;
  }

  /* Khi minimized, overlay hoàn toàn ẩn đi (không có nền đen, không có blur) */
  .PrivateChatModal__overlay--minimized {
    pointer-events: none;
    background-color: transparent !important;
    backdrop-filter: none !important;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
  }
  
  .PrivateChatModal__overlay--minimized.ReactModal__Overlay--after-open {
    background-color: transparent !important;
    backdrop-filter: none !important;
  }

  /* Nhưng icon vẫn có thể click được */
  .PrivateChatModal__overlay--minimized .PrivateChatModal__content {
    pointer-events: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); /* Thêm shadow nhẹ cho icon */
  }

  .PrivateChatModal__content {
    position: relative;
    outline: none;
  }

  // toast
  .toastClass {
    position: relative;
    margin-bottom: ${smPaddingX};
    padding: ${smPaddingX};
    border-radius: ${borderRadius};
    box-shadow: 0 ${borderSizeSmall} 10px 0 rgba(0, 0, 0, 0.1), 0 ${borderSize} 15px 0 rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: space-between;
    color: ${colorText};
    -webkit-animation-duration: 0.75s;
    animation-duration: 0.75s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
    width: 320px !important;
    cursor: pointer;
    background-color: ${colorWhite};

    &:focus {
      background-color: #EEE;
    }
  }

  .toastBodyClass {
    font-family: 'Source Sans Pro';
    margin: auto auto;
    flex: 1;
    background-color: inherit;
    max-width: 17.75rem !important;
    background-color: ${colorWhite} !important;
  }

  @keyframes track-progress {
    0% {
      width: 100%;
    }
    100% {
      width: 0;
    }
  }

  .toastProgressClass {
    position: absolute;
    bottom: 0;
    left: 0;
    right: auto;
    width: 0;
    height: 5px;
    z-index: 999;
    animation: track-progress linear 1;
    background-color: ${colorGrayLighter} !important;
    border-radius: ${borderRadius};

    [dir="rtl"] & {
      left: auto;
      right: 0;
    }
  }

  .actionToast {
    background-color: ${colorWhite};
    display: flex;
    padding: ${smPaddingX};
    border-radius: ${borderRadius};

    i.close {
      left: none !important;
    }
  }
    
  .recharts-surface {
    overflow: visible;
  }

  .raiseHandToast {
    background-color: ${colorWhite};
    padding: 1rem;

    i.close {
      left: none !important;
    }
  }

  /* Smooth transition for Session Details modal */
  .ReactModal__Overlay {
    opacity: 0;
    background-color: rgba(0, 0, 0, 0);
    transition: opacity 0.2s ease-out, background-color 0.2s ease-out;
    backdrop-filter: blur(0px);
  }

  .ReactModal__Overlay--after-open {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  .ReactModal__Overlay--before-close {
    opacity: 0;
    background-color: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
  }

  .ReactModal__Content {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
    transition: opacity 0.2s ease-out, transform 0.2s ease-out;
  }

  .ReactModal__Content--after-open {
    opacity: 1;
    transform: scale(1) translateY(0);
  }

  .ReactModal__Content--before-close {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
`;

export default GlobalStyle;
