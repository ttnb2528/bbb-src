import styled from 'styled-components';
import { colorWhite } from '/imports/ui/stylesheets/styled-components/palette';
import { mediumUp, smallOnly, hasPhoneWidth } from '/imports/ui/stylesheets/styled-components/breakpoints';
import { actionsBarHeight, navbarHeight, mdPaddingX } from '/imports/ui/stylesheets/styled-components/general';
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
  width: 100%;
  min-height: calc((100vh - calc(${navbarHeight} + ${actionsBarHeight})) * 0.2);
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;

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

// Layout m?i: Container chính chia 2 vùng (strip trên + stage gi?a)
const CustomLayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 4px; /* Giảm gap để đẩy video lên */
  padding-top: 0; /* Bỏ padding trên để đẩy video lên */
`;

// Dải cam nhỏ ở trên (tất cả người tham gia)
// Nhận prop $hasSharedContent để chỉnh padding-top: khi share thì sát trên hơn
const VideoStrip = styled.div<{
  $hasSharedContent?: boolean;
}>`
  display: flex;
  gap: 8px; /* Tăng gap để các camera cách đều nhau hơn */
  padding: ${({ $hasSharedContent }) => ($hasSharedContent ? '4px 10px 16px 10px' : '12px 10px 16px 10px')};
  background: rgba(15, 23, 42, 0.8);
  border-radius: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
  height: 150px;
  scroll-behavior: smooth;
  cursor: grab;

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

  /* Mobile responsive */
  @media ${smallOnly} {
    height: 100px;
    padding: ${({ $hasSharedContent }) => ($hasSharedContent ? '2px 6px 10px 6px' : '8px 6px 10px 6px')};
    gap: 6px; /* Tăng gap cho mobile */
  }

  @media ${hasPhoneWidth} {
    height: 80px;
    padding: ${({ $hasSharedContent }) => ($hasSharedContent ? '2px 4px 8px 4px' : '6px 4px 8px 4px')};
    gap: 4px; /* Tăng gap cho phone */
  }
`;

// Item trong d?i cam (nh?, chi?u r?ng c? d?nh)
const VideoStripItem = styled.div<{
  $isPresenter?: boolean;
}>`
  position: relative;
  width: 160px;
  height: 100%;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.35); /* Border để dễ nhìn trạng thái cam nhỏ */

  ${({ $isPresenter }) => $isPresenter && `
    /* Border nổi bật cho presenter/host */
    border: 3px solid #FF6B35 !important;
    width: 190px; /* to hon theo chiều ngang */
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
    width: 100px;
    border-radius: 6px;

    ${({ $isPresenter }) => $isPresenter && `
      width: 120px;
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
    width: 80px;
    border-radius: 4px;

    ${({ $isPresenter }) => $isPresenter && `
      width: 100px;
      transform: scale(1.01);
    `}
  }
`;

// Khung trung tâm to (hi?n th? presenter cam ho?c shared content)
const MainStage = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.95);
  border-radius: 12px;
  overflow: visible; /* visible để tag dropdown không bị cắt */
  position: relative;

  /* Video trong MainStage dùng contain để hiển thị đầy đủ nội dung */
  video {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  /* Container video tự động fit với nội dung */
  > div {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
  }
`;

// Container cho presenter cam trong stage (khi không có share)
// Điều chỉnh để container vừa khớp với video, không bị zoom
const PresenterStageVideo = styled.div`
  display: inline-flex; /* inline-flex để container vừa khớp với nội dung */
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: visible; /* visible để tag dropdown không bị cắt */
  background: transparent; /* Background trong suốt để không thấy màu đen */
  width: auto; /* Tự động điều chỉnh theo video */
  height: auto; /* Tự động điều chỉnh theo video */
  max-width: 100%; /* Không vượt quá container cha */
  max-height: 100%; /* Không vượt quá container cha */
  
  /* Ð?m b?o video item bên trong cung có border-radius */
  > div {
    width: auto; /* Tự động điều chỉnh theo video */
    height: auto; /* Tự động điều chỉnh theo video */
    max-width: 100%; /* Không vượt quá container cha */
    max-height: 100%; /* Không vượt quá container cha */
    border-radius: 12px;
    overflow: hidden; /* Chỉ overflow hidden ở video container, không phải ở wrapper */
    display: inline-flex; /* inline-flex để vừa khớp với video */
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
    width: auto; /* Tự động theo kích thước thực của video */
    height: auto; /* Tự động theo kích thước thực của video */
    max-width: 100%; /* Không vượt quá container */
    max-height: 100%; /* Không vượt quá container */
    object-fit: contain; /* contain để hiển thị đầy đủ, không bị crop */
    border-radius: 0; /* B? border-radius ? video, d? container x? lý */
    display: block; /* Để video không có khoảng trống */
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
