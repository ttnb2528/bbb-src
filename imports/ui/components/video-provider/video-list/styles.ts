import styled from 'styled-components';
import { colorWhite } from '/imports/ui/stylesheets/styled-components/palette';
import { mediumUp } from '/imports/ui/stylesheets/styled-components/breakpoints';
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
  gap: 8px;
`;

// D?i cam nh? ? trên (t?t c? ngu?i tham gia)
const VideoStrip = styled.div`
  display: flex;
  gap: 4px;
  padding: 10px 10px 16px 10px;
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

  ${({ $isPresenter }) => $isPresenter && `
    border: 2px solid #FF6B35;
    width: 190px; /* to hon theo chi?u ngang */
    box-shadow: 0 0 10px rgba(255, 107, 53, 0.6);
    transform: scale(1.03); /* nh? d? không b? méo/c?t */
  `}

  /* Thu nh? font name + status cho g?n nhung KHÔNG ?n */
  [class*="userName"],
  [class*="UserName"],
  [class*="UserStatus"] {
    font-size: 10px !important;
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
  overflow: hidden;
  position: relative;
`;

// Container cho presenter cam trong stage (khi không có share)
const PresenterStageVideo = styled.div`
  width: 80%;
  max-width: 900px;
  height: 85%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  
  /* Ð?m b?o video item bên trong cung có border-radius */
  > div {
    width: 100%;
    height: 100%;
    border-radius: 12px;
    overflow: hidden;
  }
  
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 0; /* B? border-radius ? video, d? container x? lý */
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
