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
  // BBBMenu - Mobile improvements
  @media ${smallOnly} {
    .MuiPopover-root {
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
    }
    
    /* Backdrop overlay cho mobile menu */
    .MuiBackdrop-root {
      background-color: rgba(0, 0, 0, 0.5) !important;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    
    /* Bottom sheet style cho mobile menu */
    .MuiPaper-root-mobile {
      top: auto !important;
      left: 0 !important;
      bottom: 0 !important;
      right: 0 !important;
      max-width: none !important;
      max-height: 95vh !important;
      /* Min-height động: tối thiểu 60vh để đảm bảo hiển thị đủ content */
      /* Nếu content ít: menu sẽ nhỏ hơn, nếu content nhiều: menu sẽ mở rộng đến max-height */
      /* Cân bằng giữa việc hiển thị đủ và không chiếm quá nhiều màn hình */
      min-height: 60vh !important;
      height: auto !important;
      border-radius: 20px 20px 0 0 !important;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3) !important;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      will-change: transform;
      position: fixed !important;
      transform: translateY(0) !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }
    
    /* Override inline style của Material-UI để đảm bảo menu luôn ở bottom */
    .MuiPopover-root .MuiPaper-root-mobile[style*="top"] {
      top: auto !important;
      bottom: 0 !important;
    }
    
    /* Khi Popover đóng - ẩn xuống dưới (chỉ khi có aria-hidden="true") */
    .MuiPopover-root[aria-hidden="true"] .MuiPaper-root-mobile {
      transform: translateY(100%) !important;
    }
    
    .MuiPaper-root {
      width: 100%;
    }
    
    /* Smooth animation cho menu items - đảm bảo hiển thị đầy đủ */
    .MuiPaper-root-mobile .MuiList-root {
      padding: 8px 0 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      flex: 1 1 auto !important;
      min-height: 0 !important;
      /* Cho phép list mở rộng, nhưng giới hạn để tránh vượt quá màn hình */
      /* Trừ đi chiều cao của close button (3.5rem = 56px) */
      max-height: calc(95vh - 56px) !important;
      -webkit-overflow-scrolling: touch !important;
    }
    
    /* Đảm bảo menu tự mở rộng theo content khi có nhiều items */
    .MuiPaper-root-mobile {
      /* Menu sẽ tự điều chỉnh height từ min-height đến max-height dựa trên content */
    }
    
    .MuiMenuItem-root {
      transition: background-color 0.2s ease, transform 0.1s ease !important;
      min-height: 56px !important;
      padding: 0 !important;
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    .MuiMenuItem-root:active {
      transform: scale(0.98);
      background-color: rgba(0, 0, 0, 0.05) !important;
    }
    
    /* Đảm bảo tất cả menu items hiển thị */
    .MuiPaper-root-mobile .MuiMenuItem-root,
    .MuiPaper-root-mobile .MuiList-root > * {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  }
  
  /* VideoStrip luôn full màn hình, không bị ảnh hưởng bởi sidebar */
  /* Override tất cả styles để đảm bảo VideoStrip luôn dùng viewport width */
  [class*="VideoStrip"] {
    position: fixed !important;
    max-width: calc(100vw - 28px) !important;
    width: fit-content !important;
    left: 10px !important;
    right: auto !important;
    top: 12px !important; /* Thấp xuống một chút, không sát trên quá */
    transform: none !important;
  }
  
  @media (max-width: 768px) {
    [class*="VideoStrip"] {
      max-width: calc(100vw - 24px) !important;
      left: 8px !important;
      top: 16px !important; /* Thấp xuống một chút trên mobile */
    }
  }
  
  @media (max-width: 480px) {
    [class*="VideoStrip"] {
      max-width: calc(100vw - 16px) !important;
      left: 6px !important;
      top: 14px !important; /* Thấp xuống một chút trên phone */
    }
  }
  
  @media ${smallOnly} {
    /* Override mobile styles cho emoji reactions menu - set left: 0 và căn giữa */
    .override-mobile-styles {
      left: 0 !important;
      right: 0 !important;
      margin: 0 auto !important;
      top: auto !important;
      bottom: 80px !important;
      max-width: calc(100vw - 16px) !important;
      width: fit-content !important;
      min-width: auto !important;
      border-radius: 1.7rem !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
      position: fixed !important;
      overflow: visible !important;
    }
    
    /* Override inline styles từ Material-UI */
    [id="reactions-dropdown-menu"] .override-mobile-styles[style],
    .MuiPopover-root .override-mobile-styles[style] {
      left: 0 !important;
      right: 0 !important;
      margin-left: auto !important;
      margin-right: auto !important;
      transform: none !important;
    }
    
    .override-mobile-styles .MuiList-root {
      display: flex !important;
      flex-direction: row !important;
      justify-content: center !important;
      align-items: center !important;
      padding: 0.25rem clamp(0.1rem, 0.5vw, 0.3rem) !important;
      gap: 0 !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      scrollbar-width: thin !important;
      scrollbar-color: rgba(0, 0, 0, 0.2) transparent !important;
      -webkit-overflow-scrolling: touch !important;
    }
    
    /* Scrollbar cho mobile */
    .override-mobile-styles .MuiList-root::-webkit-scrollbar {
      height: 3px !important;
    }
    
    .override-mobile-styles .MuiList-root::-webkit-scrollbar-track {
      background: transparent !important;
    }
    
    .override-mobile-styles .MuiList-root::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2) !important;
      border-radius: 3px !important;
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
    box-shadow: none !important; /* Bỏ shadow cho icon */
    background: transparent !important; /* Bỏ nền trắng */
  }

  .PrivateChatModal__content {
    position: relative;
    outline: none;
    background: transparent !important; /* Bỏ nền trắng từ ReactModal */
  }
  
  /* Bỏ nền trắng cho minimized icon */
  .PrivateChatModal__overlay--minimized .PrivateChatModal__content > div {
    background: transparent !important;
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
