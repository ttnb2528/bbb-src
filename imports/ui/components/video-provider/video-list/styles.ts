import styled from 'styled-components';
import { colorWhite } from '/imports/ui/stylesheets/styled-components/palette';
import { mediumUp, smallOnly, hasPhoneWidth } from '/imports/ui/stylesheets/styled-components/breakpoints';
import { mdPaddingX } from '/imports/ui/stylesheets/styled-components/general';
import Button from '/imports/ui/components/common/button/component';

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

  ${({ position }) => (position === 'contentRight' || position === 'contentLeft') && `
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

  ${({ position }) => (position === 'contentRight' || position === 'contentLeft') && `
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

  ${({ $focused }) => $focused && `
    grid-column: 1 / span 2;
    grid-row: 1 / span 2;
  `}

  /* PRESENTER CAM - TO HON VÀ N?I B?T HON */
  ${({ $isPresenter }) => $isPresenter && `
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
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  ${({ $position }) => ($position === 'contentRight' || $position === 'contentLeft') && `
    flex-wrap: wrap;
    align-content: center;
    order: 0;
  `}
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
const CustomLayoutContainer = styled.div`
  position: relative; /* Enable absolute positioning for VideoStrip */
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  /* Chừa không gian phía trên cho dải cam nhỏ + tạo khoảng cách với cam lớn */
  padding: clamp(120px, 10vh, 150px) 0 0 0;
  overflow: hidden; /* Prevent overflow */
  min-width: 0; /* Allow flex shrinking */
  min-height: 0; /* Allow flex shrinking */
  /* Ensure container scales properly with zoom */
  box-sizing: border-box;
`;

// Dải cam nhỏ ở trên (tất cả người tham gia) - OVERLAY trên MainStage
// Giống Google Meet: overlay nhỏ ở trên, không chiếm không gian của MainStage
const VideoStrip = styled.div<{
  $hasSharedContent?: boolean;
}>`
  position: absolute; /* Overlay trên MainStage */
  top: 0px; /* Sát mép trên hơn */
  left: 10px; /* Dock về bên trái */
  transform: none;
  z-index: 10; /* Above MainStage */
  display: flex;
  gap: clamp(6px, 0.65vw, 10px); /* Tăng gap giữa các cam nhỏ */
  // padding: ${({ $hasSharedContent }) => ($hasSharedContent ? '6px 10px 10px 10px' : '8px 10px 10px 10px')};
  background: rgba(15, 23, 42, 0.9); /* Slightly more opaque for better visibility */
  backdrop-filter: blur(8px); /* Blur effect like Google Meet */
  border-radius: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  /* Use viewport-relative height for better zoom handling, smaller to avoid overlap when zoom 150%+ */
  height: clamp(108px, 9vh, 132px); /* Nhỏ gọn hơn */
  min-height: 108px; /* Ensure minimum usable height */
  max-height: 132px; /* Maximum height */
  /* Improved max-width: ensure it doesn't overflow even at high zoom levels */
  max-width: min(calc(100vw - 28px), calc(100% - 12px)); /* Don't exceed viewport width minus padding */
  width: fit-content; /* Auto width based on content */
  min-width: 150px; /* Minimum width to show at least one camera */
  scroll-behavior: smooth;
  cursor: grab;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.32); /* Shadow for depth */
  /* Ensure VideoStrip scales properly with zoom */
  box-sizing: border-box;

  &:active {
    cursor: grabbing;
  }

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 3px;
  }

  /* Mobile responsive - đẩy lên cao hơn bằng cách giảm padding-top */
  @media ${smallOnly} {
    /* Use clamp for better responsive behavior - improved for zoom */
    height: clamp(80px, 12vh, 120px); /* Responsive: min 80px, preferred 12vh, max 120px */
    min-height: 80px; /* Reduced for better zoom handling */
    max-height: 120px;
    padding: ${({ $hasSharedContent }) => ($hasSharedContent ? '4px 8px 10px 8px' : '6px 8px 10px 8px')};
    gap: clamp(5px, 1vw, 7px); /* Responsive gap */
    /* Ensure VideoStrip doesn't overflow at high zoom */
    max-width: min(calc(100vw - 24px), calc(100% - 12px));
    left: 8px;
    top: 10px;
  }

  @media ${hasPhoneWidth} {
    /* Use clamp for better responsive behavior on phones - improved for zoom */
    height: clamp(60px, 10vh, 100px); /* Responsive: min 60px, preferred 10vh, max 100px */
    min-height: 60px; /* Reduced for better zoom handling */
    max-height: 100px;
    padding: ${({ $hasSharedContent }) => ($hasSharedContent ? '4px 6px 8px 6px' : '6px 6px 8px 6px')};
    gap: clamp(3px, 1vw, 6px); /* Responsive gap */
    /* Ensure VideoStrip doesn't overflow at high zoom */
    max-width: min(calc(100vw - 16px), calc(100% - 8px));
    left: 6px;
    top: 8px;
  }
`;

// Item trong d?i cam (nh?, chi?u r?ng c? d?nh)
const VideoStripItem = styled.div<{
  $isPresenter?: boolean;
}>`
  position: relative;
  /* Use viewport-relative units for better zoom handling */
  /* Improved clamp: better scaling at different zoom levels */
  width: clamp(110px, min(12vw, 15%), 190px); /* Bigger default size */
  height: 100%;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.35); /* Border để dễ nhìn trạng thái cam nhỏ */
  /* Ensure aspect ratio is maintained cho cam nhỏ */
  aspect-ratio: 4 / 3;
  
  /* Đảm bảo video trong VideoStripItem giữ aspect-ratio 16:9 */
  video {
    aspect-ratio: 4 / 3 !important;
  }
  min-width: 150px;
  max-width: 210px; /* Slightly larger max */
  /* Ensure proper scaling with zoom */
  box-sizing: border-box;

  ${({ $isPresenter }) => $isPresenter && `
    /* Border nổi bật cho presenter/host */
    border: 3px solid #FF6B35 !important;
    width: clamp(150px, min(14vw, 17%), 210px); /* Larger for presenter */
    min-width: 150px;
    max-width: 210px;
    /* Bỏ scale để video hiển thị đủ nội dung, không bị zoom */
  `}

  /* Thu nh? font name + status cho g?n nhung KHÔNG ?n */
  [class*="userName"],
  [class*="UserName"],
  [class*="UserStatus"] {
    font-size: 10px !important;
  }

  /* Mobile responsive */
  @media ${smallOnly} {
    /* Use clamp for better responsive behavior - improved for zoom */
    width: clamp(80px, min(15vw, 18%), 120px); /* Responsive: min 80px, preferred min(15vw, 18%), max 120px */
    border-radius: 6px;
    min-width: 80px; /* Reduced for better zoom handling */
    max-width: 120px;

    ${({ $isPresenter }) => $isPresenter && `
      width: clamp(100px, min(18vw, 20%), 140px); /* Responsive: min 100px, preferred min(18vw, 20%), max 140px */
      min-width: 100px;
      max-width: 140px;
      transform: scale(1.02);
      /* Bỏ box-shadow màu cam phát sáng */
    `}

    [class*="userName"],
    [class*="UserName"],
    [class*="UserStatus"] {
      font-size: 8px !important;
    }
  }

  @media ${hasPhoneWidth} {
    /* Use clamp for better responsive behavior on phones - improved for zoom */
    width: clamp(60px, min(20vw, 25%), 100px); /* Responsive: min 60px, preferred min(20vw, 25%), max 100px */
    border-radius: 4px;
    min-width: 60px; /* Reduced for better zoom handling */
    max-width: 100px;

    ${({ $isPresenter }) => $isPresenter && `
      width: clamp(80px, min(25vw, 30%), 120px); /* Responsive: min 80px, preferred min(25vw, 30%), max 120px */
      min-width: 80px;
      max-width: 120px;
      transform: scale(1.01);
    `}
  }
`;

// Khung trung tâm to (hiển thị presenter cam hoặc shared content)
// Mục tiêu: giống Google Meet – video lấp đầy khung trung tâm, chấp nhận crop một chút
const MainStage = styled.div`
  flex: 1;
  display: flex;
  align-items: center; /* Canh giữa, tránh kéo video full chiều cao */
  justify-content: center;
  background: rgba(15, 23, 42, 0.95);
  border-radius: 12px;
  overflow: hidden; /* Ẩn phần video bị crop để không thấy viền đen */
  position: relative;
  min-width: 0; /* Allow flex shrinking */
  min-height: 0; /* Allow flex shrinking */
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-height: 88vh; /* Giới hạn chiều cao để video không phóng quá to */

  /* Smooth transition khi sidebar mở/đóng - giống Google Meet */
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              height 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  /* Video trong MainStage ưu tiên lấp đầy khung (giống Google Meet) */
  video {
    width: 100% !important;
    height: 100% !important;
    max-width: 100% !important;
    max-height: 100% !important;
    object-fit: cover !important; /* Lấp đầy khung, chấp nhận crop nhẹ để tránh viền đen */
    box-sizing: border-box;
    /* Bỏ aspect-ratio constraint để video fill container tự do */
    aspect-ratio: unset !important;

    /* Không zoom thêm khi đã có sidebar/gutter, tránh cảm giác quá sát viền */
    transform: none;
  }

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
`;

// Container cho presenter cam trong stage (khi không có share)
// Mục tiêu: video luôn tràn full MainStage giống Google Meet
const PresenterStageVideo = styled.div`
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
    object-fit: contain; /* Khớp với preview: không crop, giữ đầy đủ khung hình */
    border-radius: 0;
    display: block;
  }
`;

// Placeholder khi chua có presenter
const StagePlaceholder = styled.div`
  color: #ffffff;
  font-size: 18px;
  opacity: 0.6;
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
  VideoStripItem,
  MainStage,
  PresenterStageVideo,
  StagePlaceholder,
};
