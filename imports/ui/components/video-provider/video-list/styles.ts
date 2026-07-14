import styled from "styled-components";
import { colorWhite } from "/imports/ui/stylesheets/styled-components/palette";
import {
  mediumUp,
  smallOnly,
  hasPhoneWidth,
} from "/imports/ui/stylesheets/styled-components/breakpoints";
import { mdPaddingX } from "/imports/ui/stylesheets/styled-components/general";
import Button from "/imports/ui/components/common/button/component";

// @ts-expect-error -> Untyped component.
const NextPageButton = styled(Button)`
  color: ${colorWhite};
  width: ${mdPaddingX};

  & > i {
    [dir="rtl"] & {
      -webkit-transform: scale(-1, 1);
      -moz-transform: scale(-1, 1);
      -ms-transform: scale(-1, 1);
      -o-transform: scale(-1, 1);
      transform: scale(-1, 1);
    }
  }

  margin-left: 1px;

  @media ${mediumUp} {
    margin-left: 2px;
  }

  ${({ position }) =>
    (position === "contentRight" || position === "contentLeft") &&
    `
    order: 3;
    margin-right: 2px;
  `}
`;

// @ts-expect-error -> Untyped component.
const PreviousPageButton = styled(Button)`
  color: ${colorWhite};
  width: ${mdPaddingX};

  i {
    [dir="rtl"] & {
      -webkit-transform: scale(-1, 1);
      -moz-transform: scale(-1, 1);
      -ms-transform: scale(-1, 1);
      -o-transform: scale(-1, 1);
      transform: scale(-1, 1);
    }
  }

  margin-right: 1px;

  @media ${mediumUp} {
    margin-right: 2px;
  }

  ${({ position }) =>
    (position === "contentRight" || position === "contentLeft") &&
    `
    order: 2;
    margin-left: 2px;
  `}
`;

const VideoListItem = styled.div<{
  $focused: boolean;
  $isPresenter?: boolean;
}>`
  display: flex;
  overflow: hidden;
  width: 100%;
  max-height: 100%;

  ${({ $focused }) =>
    $focused &&
    `
    grid-column: 1 / span 2;
    grid-row: 1 / span 2;
  `}

  /* PRESENTER CAM - TO HON VÀ N?I B?T HON */
  ${({ $isPresenter }) =>
    $isPresenter &&
    `
    grid-column: 1 / span 2;
    grid-row: 1 / span 2;
    order: -1;
    z-index: 1;
  `}
`;

const VideoCanvas = styled.div<{
  $position: string;
}>`
  position: absolute;
  /* Để LayoutEngine (customLayout) quyết định width/height thông qua inline style.
     Ở đây chỉ cần VideoCanvas fill 100% vùng mediaBounds được tính sẵn. */
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  /* Ensure VideoCanvas scales properly with zoom */
  box-sizing: border-box;
  overflow: hidden; /* Prevent overflow at high zoom */

  /* Smooth transition khi sidebar mở/đóng - giống Google Meet */
  transition:
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  ${({ $position }) =>
    ($position === "contentRight" || $position === "contentLeft") &&
    `
    flex-wrap: wrap;
    align-content: center;
    order: 0;
  `}

  body.bbb-one-to-one-call & {
    background: radial-gradient(
        circle at 15% 10%,
        rgba(114, 173, 250, 0.11),
        transparent 42%
      ),
      radial-gradient(
        circle at 85% 8%,
        rgba(173, 151, 250, 0.1),
        transparent 45%
      ),
      linear-gradient(180deg, #031224 0%, #02101f 62%, #010d19 100%);
  }
`;

const VideoList = styled.div`
  display: grid;

  grid-auto-flow: dense;
  grid-gap: 1px;

  justify-content: center;

  @media ${mediumUp} {
    grid-gap: 2px;
  }
`;

const Break = styled.div`
  order: 1;
  flex-basis: 100%;
  height: 5px;
`;

// Layout m?i: Container chính - MainStage chiếm full height, VideoStrip overlay
const CustomLayoutContainer = styled.div<{
  $hasSharedContent?: boolean;
  $isLandscape?: boolean;
}>`
  position: relative; /* Enable absolute positioning for VideoStrip */
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  /* Chừa không gian phía trên cho dải cam nhỏ + tạo khoảng cách với cam lớn */
  /* Khi share content thì không cần padding vì MainStage đã bị ẩn */
  padding: ${({ $hasSharedContent, $isLandscape, $isStripCollapsed }) =>
    $hasSharedContent
      ? "0"
      : $isLandscape
        ? $isStripCollapsed
          ? "15px"
          : "15px 15px 15px clamp(110px, 15vw, 130px)"
        : "clamp(120px, 10vh, 150px) 15px 25px 15px"};
  transition: padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden; /* Prevent overflow */
  min-width: 0; /* Allow flex shrinking */
  min-height: 0; /* Allow flex shrinking */
  /* Ensure container scales properly with zoom */
  box-sizing: border-box;
  pointer-events: none; /* Cho phép click xuyên qua để vẽ bảng */

  body.bbb-one-to-one-call & {
    padding: 10px 10px clamp(12px, 2.2vh, 22px) 10px;
    background: radial-gradient(
        circle at 15% 10%,
        rgba(114, 173, 250, 0.11),
        transparent 42%
      ),
      radial-gradient(
        circle at 85% 8%,
        rgba(173, 151, 250, 0.1),
        transparent 45%
      ),
      linear-gradient(180deg, #031224 0%, #02101f 62%, #010d19 100%);
  }
`;

// Dải cam nhỏ ở trên (tất cả người tham gia) - OVERLAY trên MainStage
// Giống Google Meet: overlay nhỏ ở trên, không chiếm không gian của MainStage
// VideoStrip luôn full màn hình, không bị ảnh hưởng bởi sidebar
const VideoStrip = styled.div<{
  $hasSharedContent?: boolean;
  $hasSidebarOpen?: boolean;
  $isLandscape?: boolean;
}>`
  position: relative !important; /* Relative để nằm trong flex container */
  flex: 1; /* Chiếm phần còn lại của wrapper */
  min-width: 0; /* Cho phép shrink */
  /* QUAN TRỌNG: Trên mobile, khi sidebar mở, giảm z-index để sidebar hiển thị trên video strip */
  z-index: ${({ $hasSidebarOpen }) =>
    $hasSidebarOpen
      ? 5
      : 10} !important; /* Above MainStage, below sidebar when open */
  display: flex !important;
  gap: clamp(6px, 0.65vw, 10px); /* Tăng gap giữa các cam nhỏ */
  padding: ${({ $hasSharedContent }) =>
    $hasSharedContent ? "6px 10px 10px 10px" : "8px 10px 10px 10px"};
  backdrop-filter: ${({ $isLandscape }) =>
    $isLandscape ? "none" : "blur(8px)"};
  background-color: ${({ $isLandscape }) =>
    $isLandscape ? "transparent" : "rgba(0,0,0,0.2)"};
  border-radius: 8px;
  overflow-x: ${({ $isLandscape }) => ($isLandscape ? "hidden" : "auto")};
  overflow-y: ${({ $isLandscape }) => ($isLandscape ? "auto" : "hidden")};
  /* Use viewport-relative height for better zoom handling */
  height: ${({ $isLandscape }) =>
    $isLandscape ? "100%" : "clamp(108px, 9vh, 132px)"} !important;
  min-height: ${({ $isLandscape }) =>
    $isLandscape ? "0" : "108px"} !important;
  max-height: ${({ $isLandscape }) =>
    $isLandscape ? "100%" : "132px"} !important;
  flex-direction: ${({ $isLandscape }) =>
    $isLandscape ? "column" : "row"} !important;
  /* Width sẽ được tính từ flex container */
  width: 100%;
  max-width: 100%;
  scroll-behavior: smooth;
  cursor: grab;
  box-shadow: none;
  pointer-events: auto !important; /* Quan trọng: Cho phép touch/click vào danh sách cam để cuộn */
  -webkit-overflow-scrolling: touch; /* Cuộn mượt trên iOS */
  /* Ensure VideoStrip scales properly with zoom */
  box-sizing: border-box;

  & > * {
    pointer-events: auto; /* Trả lại tương tác cho video box */
  }

  &:active {
    cursor: grabbing;
  }

  /* Ẩn scrollbar nhưng vẫn cho phép scroll */
  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  /* Mobile responsive - đẩy lên cao hơn bằng cách giảm padding-top */
  @media ${smallOnly} {
    ${({ $isLandscape }) =>
      $isLandscape
        ? `
      flex-direction: column !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      height: 100% !important;
      max-height: none !important;
      width: 100% !important;
    `
        : `
      /* Use clamp for better responsive behavior - improved for zoom */
      height: clamp(80px, 12vh, 120px) !important;
      min-height: 80px !important;
      max-height: 120px !important;
      width: 100%;
      max-width: 100%;
    `}
    padding: ${({ $hasSharedContent }) =>
      $hasSharedContent ? "4px 8px 10px 8px" : "6px 8px 10px 8px"};
    gap: clamp(8px, 1.5vw, 12px); /* Tăng gap để các cam không dính nhau */
    /* Bỏ box-shadow trên mobile để gọn hơn */
    box-shadow: none;
    position: relative !important;
    /* QUAN TRỌNG: Trên mobile, khi sidebar mở, giảm z-index để sidebar hiển thị trên video strip */
    z-index: ${({ $hasSidebarOpen }) => ($hasSidebarOpen ? 5 : 10)} !important;
  }

  @media ${hasPhoneWidth} {
    ${({ $isLandscape }) =>
      $isLandscape
        ? `
      flex-direction: column !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      height: 100% !important;
      max-height: none !important;
      width: 100% !important;
    `
        : `
      /* Use clamp for better responsive behavior on phones - improved for zoom */
      height: clamp(60px, 12vh, 100px) !important;
      min-height: 60px !important;
      max-height: 100px !important;
      width: 100%;
      max-width: 100%;
    `}
    padding: ${({ $hasSharedContent }) =>
      $hasSharedContent ? "4px 6px 8px 6px" : "6px 6px 8px 6px"};
    gap: clamp(6px, 1.2vw, 10px); /* Tăng gap để các cam không dính nhau */
    /* Bỏ box-shadow trên mobile để gọn hơn */
    box-shadow: none;
    position: relative !important;
    /* QUAN TRỌNG: Trên mobile, khi sidebar mở, giảm z-index để sidebar hiển thị trên video strip */
    z-index: ${({ $hasSidebarOpen }) => ($hasSidebarOpen ? 5 : 10)} !important;
  }

  body.bbb-one-to-one-call & {
    height: clamp(108px, 13vh, 148px) !important;
    min-height: 108px !important;
    max-height: 148px !important;
    width: clamp(180px, 19vw, 252px) !important;
    min-width: 180px !important;
    max-width: 252px !important;
    padding: 0 !important;
    border-radius: 18px;
    border: none;
    box-shadow: 0 14px 32px rgba(2, 6, 16, 0.36);
    backdrop-filter: blur(10px);
    overflow: hidden;
    cursor: default;
  }
`;

// Item trong d?i cam (nh?, chi?u r?ng c? d?nh)
const VideoStripItem = styled.div<{
  $isPresenter?: boolean;
  $isLandscape?: boolean;
}>`
  position: relative;
  /* Use viewport-relative units for better zoom handling */
  /* Improved clamp: better scaling at different zoom levels */
  width: clamp(90px, min(10vw, 12%), 140px); /* Giảm chiều rộng để gọn hơn */
  height: 100%;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  border: none; /* Dùng border của Content::after để không bị viền kép khi đang nói */
  /* Ensure aspect ratio is maintained cho cam nhỏ */
  aspect-ratio: 4 / 3;

  /* Đảm bảo video trong VideoStripItem giữ aspect-ratio 16:9 */
  video {
    aspect-ratio: 4 / 3 !important;
  }
  min-width: 90px;
  max-width: 140px; /* Giảm max-width để gọn hơn */
  /* Ensure proper scaling with zoom */
  box-sizing: border-box;

  ${({ $isPresenter }) =>
    $isPresenter &&
    `
    /* Border nổi bật cho presenter/host */
    border: 3px solid #6366F1 !important; /* Indigo */
    width: clamp(110px, min(12vw, 14%), 160px); /* Giảm kích thước presenter để gọn hơn */
    min-width: 110px;
    max-width: 160px;
    /* Bỏ scale để video hiển thị đủ nội dung, không bị zoom */
  `}

  /* Áp dụng 100% width cho landscape mobile mà không bị bọc trong media query smallOnly */
  ${({ $isLandscape }) =>
    $isLandscape &&
    `
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: auto !important;
  `}

  /* Thu nh? font name + status cho g?n nhung KHÔNG ?n */
  [class*="userName"],
  [class*="UserName"],
  [class*="UserStatus"] {
    font-size: 10px !important;
  }

  /* Mobile responsive */
  @media ${smallOnly} {
    /* Điều chỉnh kích thước cam cho phù hợp với tablet */
    width: clamp(75px, min(15vw, 18%), 110px); /* Giảm kích thước để gọn hơn */
    border-radius: 6px;
    min-width: 75px;
    max-width: 110px;

    @media (orientation: landscape) {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: auto !important;
    }

    ${({ $isPresenter }) =>
      $isPresenter &&
      `
      width: clamp(90px, min(18vw, 20%), 130px); /* Giảm kích thước presenter */
      min-width: 90px;
      max-width: 130px;
      transform: none; /* Bỏ scale để không bị lệch */
    `}

    [class*="userName"],
    [class*="UserName"],
    [class*="UserStatus"] {
      font-size: 8px !important;
    }
  }

  @media ${hasPhoneWidth} {
    /* Điều chỉnh kích thước cam cho phù hợp với phone */
    width: clamp(80px, min(20vw, 24%), 100px); /* Giảm kích thước để gọn hơn */
    border-radius: 4px;
    min-width: 80px;
    max-width: 100px;

    @media (orientation: landscape) {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: auto !important;
    }

    ${({ $isPresenter }) =>
      $isPresenter &&
      `
      width: clamp(90px, min(24vw, 28%), 120px); /* Giảm kích thước presenter */
      min-width: 90px;
      max-width: 120px;
      transform: none; /* Bỏ scale để không bị lệch */
    `}
  }

  body.bbb-one-to-one-call & {
    width: 100% !important;
    min-width: 100% !important;
    max-width: 100% !important;
    border-radius: 18px;
    border: none;
    padding: 0;
    box-sizing: border-box;
  }
`;

// Khung trung tâm to (hiển thị presenter cam hoặc shared content)
// Mục tiêu: giống Google Meet – video lấp đầy khung trung tâm, chấp nhận crop một chút
const MainStage = styled.div`
  flex: 1;
  display: flex;
  align-items: center; /* Canh giữa, tránh kéo video full chiều cao */
  justify-content: center;
  background: #000; /* Đồng bộ nền đen tuyệt đối với object-fit contain */
  border-radius: 12px;
  overflow: hidden; /* Ẩn phần video bị crop để không thấy viền đen */
  position: relative;
  pointer-events: auto; /* QUAN TRỌNG: Cho phép tương tác click vào Camera lớn */
  min-width: 0; /* Allow flex shrinking */
  min-height: 0; /* Allow flex shrinking */
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-height: 100%; /* Cho phép bung full chiều cao theo Layout Manager */

  /* Smooth transition khi sidebar mở/đóng - giống Google Meet */
  transition:
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  /* Container video tự động fit với khung */
  > div {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  body.bbb-one-to-one-call & {
    border-radius: 16px;
    border: none;
    box-shadow: none;
    background: linear-gradient(
      180deg,
      rgba(5, 17, 35, 0.96) 0%,
      rgba(3, 14, 29, 0.98) 100%
    );
  }
`;

// Container cho presenter cam trong stage (khi không có share)
// Mục tiêu: video luôn tràn full MainStage giống Google Meet
// Điều chỉnh object-fit dựa trên sidebar: cover khi sidebar mở, contain khi đóng
const PresenterStageVideo = styled.div<{
  $hasSidebarOpen?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden; /* Ẩn phần video bị crop */
  background: transparent; /* Background trong suốt để không thấy màu đen */
  width: 100%; /* Tràn đủ ngang MainStage */
  height: 100%; /* Tràn đủ dọc MainStage */
  max-width: 100%;
  max-height: 100%;

  /* Đảm bảo video item bên trong cũng fill toàn bộ container */
  > div {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    position: relative; /* Để tag dropdown có thể hiển thị */

    /* Xóa hiệu ứng glow màu cam cho cam lớn (main stage) */
    box-shadow: none !important;

    &::after {
      box-shadow: none !important;
    }
  }

  video {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    /* Giữ nguyên contain để không bị crop xén mảng lớn khung hình webcam */
    object-fit: contain;
    object-position: center center;
    border-radius: 0;
    display: block;
  }

  body.bbb-one-to-one-call & {
    border-radius: 20px;
    background: linear-gradient(
      180deg,
      rgba(6, 20, 40, 0.95) 0%,
      rgba(4, 14, 30, 0.98) 100%
    );
    aspect-ratio: auto;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    margin: 0;
  }

  body.bbb-one-to-one-call & video {
    object-fit: contain;
    object-position: center center;
    background: #020916;
  }
`;

// Placeholder khi chua có presenter
const StagePlaceholder = styled.div`
  color: #ffffff;
  font-size: 18px;
  opacity: 0.6;
`;

// Wrapper cho VideoStrip và scroll arrows
const VideoStripWrapper = styled.div<{
  $isLandscape?: boolean;
  $isStripCollapsed?: boolean;
}>`
  position: fixed !important;
  top: 12px !important;
  left: 10px !important;
  right: 10px !important;
  z-index: 10 !important;
  pointer-events: none; /* Cho phép click qua wrapper, chỉ click vào arrows và strip */
  display: flex;
  align-items: center;
  gap: 4px;
  width: calc(100vw - 20px) !important; /* Full width minus padding */
  max-width: calc(100vw - 20px) !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* Áp dụng logic Landscape luôn mà không phụ thuộc viewport width (vì deviceInfo.isMobile đã chặn desktop) */
  ${({ $isLandscape, $isStripCollapsed }) =>
    $isLandscape &&
    `
      top: 14px !important;
      bottom: 80px !important;
      left: max(6px, env(safe-area-inset-left)) !important;
      right: auto !important;
      width: clamp(55px, 9vw, 75px) !important; /* Thu nhỏ box cam lại để không đè nhiều lên màn hình share */
      max-width: 75px !important;
      flex-direction: column !important;
      transform: ${
        $isStripCollapsed
          ? "translateX(calc(-100% - max(10px, env(safe-area-inset-left))))"
          : "translateX(0)"
      };
      height: calc(100vh - 100px); /* Cho phép chiều cao dài ra để chứa nhiều cam */
  `}

  /* Mobile responsive (chỉ áp dụng khi KHÔNG landscape) */
  @media ${smallOnly} {
    ${({ $isLandscape }) =>
      !$isLandscape &&
      `
      top: 16px !important;
      left: 8px !important;
      right: 8px !important;
      width: calc(100vw - 16px) !important;
      max-width: calc(100vw - 16px) !important;
    `}
  }

  @media ${hasPhoneWidth} {
    ${({ $isLandscape }) =>
      !$isLandscape &&
      `
      top: 14px !important;
      left: 6px !important;
      right: 6px !important;
      width: calc(100vw - 12px) !important;
      max-width: calc(100vw - 12px) !important;
    `}
  }

  body.bbb-one-to-one-call & {
    top: 14px !important;
    bottom: auto !important;
    right: 14px !important;
    left: auto !important;
    width: clamp(180px, 19vw, 252px) !important;
    min-width: 180px !important;
    max-width: 252px !important;
    justify-content: flex-end;
    gap: 0;
    z-index: 35 !important;
  }
`;

// Mũi tên scroll (trái/phải) - nằm 2 bên của dải camera
const ScrollArrow = styled.button<{
  $position: "left" | "right";
  $isLandscape?: boolean;
}>`
  display: ${({ $isLandscape }) =>
    $isLandscape ? "none !important" : "block"};
  position: relative;
  z-index: 12; /* Above VideoStrip */
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  outline: none;
  pointer-events: auto; /* Cho phép click vào arrow */
  flex-shrink: 0;

  /* Icon styling */
  svg,
  i {
    font-size: 16px;
    width: 16px;
    height: 16px;
    opacity: 0.9;
    color: inherit;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  /* Mobile responsive */
  @media ${smallOnly} {
    width: 28px;
    height: 28px;

    i {
      font-size: 14px;
    }
  }

  @media ${hasPhoneWidth} {
    width: 24px;
    height: 24px;

    i {
      font-size: 12px;
    }
  }

  body.bbb-one-to-one-call & {
    display: none !important;
  }
`;

const StripToggleButton = styled.button<{ $isStripCollapsed?: boolean }>`
  position: absolute;
  top: 48px; /* Căn xuống một chút từ viền trên để né Dynamic Island ở giữa và không bị thấp */
  width: 32px;
  height: 32px;
  background-color: rgba(15, 23, 42, 0.65); /* Dark slate semi-transparent */
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  pointer-events: auto;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* Logic vị trí và hình dáng thông minh */
  ${({ $isStripCollapsed }) =>
    $isStripCollapsed
      ? `
        /* KHI ĐÓNG: Nhô hẳn ra ngoài mép trái màn hình và bù trừ phần Tai thỏ (Dynamic Island) để luôn bấm được */
        right: calc(-36px - env(safe-area-inset-left)); 
        border-radius: 0 16px 16px 0; /* Hình dáng tab nửa tròn ôm mép màn hình */
      `
      : `
        /* KHI MỞ: Nằm ngay mép phải, nhô ra một nửa để không che mất camera */
        right: -16px; 
        border-radius: 50%; /* Nút hình tròn hoàn hảo */
      `}

  &:hover {
    background-color: rgba(15, 23, 42, 0.9);
    transform: scale(1.1);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }

  i {
    font-size: 14px;
    margin-left: ${({ $isStripCollapsed }) =>
      $isStripCollapsed ? "2px" : "-2px"};
  }
`;

export default {
  NextPageButton,
  PreviousPageButton,
  VideoListItem,
  VideoCanvas,
  VideoList,
  Break,
  CustomLayoutContainer,
  VideoStrip,
  VideoStripWrapper,
  VideoStripItem,
  MainStage,
  PresenterStageVideo,
  StagePlaceholder,
  ScrollArrow,
  StripToggleButton,
};
