import React, { Component } from 'react';
import { createPortal } from 'react-dom';
import { IntlShape, defineMessages, injectIntl } from 'react-intl';
import { UpdatedDataForUserCameraDomElement } from 'bigbluebutton-html-plugin-sdk/dist/cjs/dom-element-manipulation/user-camera/types';
import { throttle } from '/imports/utils/throttle';
import { range } from '/imports/utils/array-utils';
import Styled from './styles';
import VideoListItemContainer from './video-list-item/container';
import AutoplayOverlay from '/imports/ui/components/media/autoplay-overlay/component';
import logger from '/imports/startup/client/logger';
import playAndRetry from '/imports/utils/mediaElementPlayRetry';
import VideoService from '/imports/ui/components/video-provider/service';
import { ACTIONS } from '/imports/ui/components/layout/enums';
import { Output } from '/imports/ui/components/layout/layoutTypes';
import { VideoItem } from '/imports/ui/components/video-provider/types';
import { VIDEO_TYPES } from '/imports/ui/components/video-provider/enums';
import { UserCameraHelperAreas } from '../../plugins-engine/extensible-areas/components/user-camera-helper/types';
import Icon from '/imports/ui/components/common/icon/component';

const intlMessages = defineMessages({
  autoplayBlockedDesc: {
    id: 'app.videoDock.autoplayBlockedDesc',
  },
  autoplayAllowLabel: {
    id: 'app.videoDock.autoplayAllowLabel',
  },
  nextPageLabel: {
    id: 'app.video.pagination.nextPage',
  },
  prevPageLabel: {
    id: 'app.video.pagination.prevPage',
  },
});

declare global {
  interface WindowEventMap {
    'videoPlayFailed': CustomEvent<{ mediaElement: HTMLVideoElement }>;
  }
}

const findOptimalGrid = (
  canvasWidth: number,
  canvasHeight: number,
  gutter: number,
  aspectRatio: number,
  numItems: number,
  columns = 1,
) => {
  const rows = Math.ceil(numItems / columns);
  const gutterTotalWidth = (columns - 1) * gutter;
  const gutterTotalHeight = (rows - 1) * gutter;
  const usableWidth = canvasWidth - gutterTotalWidth;
  const usableHeight = canvasHeight - gutterTotalHeight;
  let cellWidth = Math.floor(usableWidth / columns);
  let cellHeight = Math.ceil(cellWidth / aspectRatio);
  if ((cellHeight * rows) > usableHeight) {
    cellHeight = Math.floor(usableHeight / rows);
    cellWidth = Math.ceil(cellHeight * aspectRatio);
  }
  return {
    columns,
    rows,
    width: (cellWidth * columns) + gutterTotalWidth,
    height: (cellHeight * rows) + gutterTotalHeight,
    filledArea: (cellWidth * cellHeight) * numItems,
  };
};

const ASPECT_RATIO = 4 / 3;
// const ACTION_NAME_BACKGROUND = 'blurBackground';

interface VideoListProps {
  pluginUserCameraHelperPerPosition: UserCameraHelperAreas;
  layoutType: string;
  layoutContextDispatch: (...args: unknown[]) => void;
  numberOfPages: number;
  currentVideoPageIndex: number;
  cameraDock: Output['cameraDock'];
  mediaArea: Output['mediaArea'];
  focusedId: string;
  handleVideoFocus: (id: string) => void;
  isGridEnabled: boolean;
  // Đang share nội dung (presentation hoặc screen share)
  hasSharedContent: boolean;
  // Sidebar có mở không - để điều chỉnh object-fit của video
  hasSidebarOpen: boolean;
  streams: VideoItem[];
  intl: IntlShape;
  setUserCamerasRequestedFromPlugin: React.Dispatch<React.SetStateAction<UpdatedDataForUserCameraDomElement[]>>;
  onVideoItemMount: (stream: string, video: HTMLVideoElement) => void;
  onVideoItemUnmount: (stream: string) => void;
  onVirtualBgDrop: (stream: string, type: string, name: string, data: string) => Promise<unknown>;
}

interface VideoListState {
  optimalGrid: {
    cols: number,
    rows: number,
    filledArea: number,
    width: number;
    height: number;
    columns: number;
  },
  autoplayBlocked: boolean,
  canScrollLeft: boolean,
  canScrollRight: boolean,
}

class VideoList extends Component<VideoListProps, VideoListState> {
  private ticking: boolean;

  private grid: HTMLDivElement | null;

  private canvas: HTMLDivElement | null;

  private stripRef: React.RefObject<HTMLDivElement>;

  private failedMediaElements: unknown[];

  private autoplayWasHandled: boolean;

  private isDragging: boolean;

  private dragStartX: number;

  private dragStartScrollLeft: number;

  constructor(props: VideoListProps) {
    super(props);

    this.state = {
      optimalGrid: {
        cols: 1,
        rows: 1,
        filledArea: 0,
        columns: 0,
        height: 0,
        width: 0,
      },
      autoplayBlocked: false,
      canScrollLeft: false,
      canScrollRight: false,
    };

    this.ticking = false;
    this.grid = null;
    this.canvas = null;
    this.stripRef = React.createRef<HTMLDivElement>();
    this.failedMediaElements = [];
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartScrollLeft = 0;
    this.handleCanvasResize = throttle(this.handleCanvasResize.bind(this), 66,
      {
        leading: true,
        trailing: true,
      });
    this.setOptimalGrid = this.setOptimalGrid.bind(this);
    this.handleAllowAutoplay = this.handleAllowAutoplay.bind(this);
    this.handlePlayElementFailed = this.handlePlayElementFailed.bind(this);
    this.autoplayWasHandled = false;
    this.updateScrollButtons = this.updateScrollButtons.bind(this);
    this.handleScrollLeft = this.handleScrollLeft.bind(this);
    this.handleScrollRight = this.handleScrollRight.bind(this);
    this.handleStripMouseDown = this.handleStripMouseDown.bind(this);
    this.handleStripMouseMove = this.handleStripMouseMove.bind(this);
    this.handleStripMouseUp = this.handleStripMouseUp.bind(this);
    this.handleStripMouseLeave = this.handleStripMouseLeave.bind(this);
    this.handleGlobalMouseMove = this.handleGlobalMouseMove.bind(this);
    this.handleGlobalMouseUp = this.handleGlobalMouseUp.bind(this);
  }

  componentDidMount() {
    this.handleCanvasResize();
    window.addEventListener('resize', this.handleCanvasResize, false);
    window.addEventListener('videoPlayFailed', this.handlePlayElementFailed);
    // Thêm global mouse event listeners cho drag scroll (dùng capture phase để bắt sớm)
    document.addEventListener('mousemove', this.handleGlobalMouseMove, true);
    document.addEventListener('mouseup', this.handleGlobalMouseUp, true);
    // Update scroll buttons sau khi mount
    setTimeout(() => {
      this.updateScrollButtons();
    }, 100);
  }

  componentDidUpdate(prevProps: VideoListProps) {
    const {
      layoutType, cameraDock, streams, focusedId,
    } = this.props;
    const { width: cameraDockWidth, height: cameraDockHeight } = cameraDock;
    const {
      layoutType: prevLayoutType,
      cameraDock: prevCameraDock,
      streams: prevStreams,
      focusedId: prevFocusedId,
    } = prevProps;
    const { width: prevCameraDockWidth, height: prevCameraDockHeight } = prevCameraDock;

    if (layoutType !== prevLayoutType
      || focusedId !== prevFocusedId
      || cameraDockWidth !== prevCameraDockWidth
      || cameraDockHeight !== prevCameraDockHeight
      || streams.length !== prevStreams.length) {
      this.handleCanvasResize();
      // Update scroll buttons khi streams thay đổi
      setTimeout(() => {
        this.updateScrollButtons();
      }, 100);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleCanvasResize, false);
    window.removeEventListener('videoPlayFailed', this.handlePlayElementFailed);
    // Xóa global mouse event listeners
    document.removeEventListener('mousemove', this.handleGlobalMouseMove, true);
    document.removeEventListener('mouseup', this.handleGlobalMouseUp, true);
  }

  handleAllowAutoplay() {
    const { autoplayBlocked } = this.state;

    logger.info({
      logCode: 'video_provider_autoplay_allowed',
    }, 'Video media autoplay allowed by the user');

    this.autoplayWasHandled = true;
    window.removeEventListener('videoPlayFailed', this.handlePlayElementFailed);
    while (this.failedMediaElements.length) {
      const mediaElement = this.failedMediaElements.shift();
      if (mediaElement) {
        const played = playAndRetry(mediaElement);
        if (!played) {
          logger.error({
            logCode: 'video_provider_autoplay_handling_failed',
          }, 'Video autoplay handling failed to play media');
        } else {
          logger.info({
            logCode: 'video_provider_media_play_success',
          }, 'Video media played successfully');
        }
      }
    }
    if (autoplayBlocked) { this.setState({ autoplayBlocked: false }); }
  }

  handlePlayElementFailed(e: CustomEvent<{ mediaElement: HTMLVideoElement }>) {
    const { mediaElement } = e.detail;
    const { autoplayBlocked } = this.state;

    e.stopPropagation();
    this.failedMediaElements.push(mediaElement);
    if (!autoplayBlocked && !this.autoplayWasHandled) {
      logger.info({
        logCode: 'video_provider_autoplay_prompt',
      }, 'Prompting user for action to play video media');
      this.setState({ autoplayBlocked: true });
    }
  }

  handleCanvasResize() {
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        this.ticking = false;
        this.setOptimalGrid();
      });
    }
    this.ticking = true;
  }

  setOptimalGrid() {
    const {
      streams,
      cameraDock,
      layoutContextDispatch,
    } = this.props;
    let numItems = streams.length;

    if (numItems < 1 || !this.canvas || !this.grid) {
      return;
    }
    const { focusedId } = this.props;
    const canvasWidth = cameraDock?.width;
    const canvasHeight = cameraDock?.height;

    const gridGutter = parseInt(window.getComputedStyle(this.grid)
      .getPropertyValue('grid-row-gap'), 10);

    // Ki?m tra xem có presenter không
    const hasPresenter = streams.some((s) => {
      const anyItem = s as any;
      if (s.type === VIDEO_TYPES.STREAM) {
        return anyItem?.user?.presenter;
      }
      if (s.type === VIDEO_TYPES.GRID) {
        return anyItem?.presenter;
      }
      return false;
    });

    const hasFocusedItem = streams.filter(
      (s) => s.type !== VIDEO_TYPES.GRID && s.stream === focusedId,
    ).length && numItems > 2;

    // N?u có presenter, tính grid riêng: presenter chi?m 2x2, các cam còn l?i x?p bên c?nh
    let optimalGrid;
    if (hasPresenter) {
      const remainingCams = numItems - 1;
      // Tính grid cho các cam còn l?i (không tính presenter)
      // Presenter chi?m 2 c?t d?u, nên các cam còn l?i c?n ít nh?t 2 c?t d? x?p g?n
      const minColsForRemaining = Math.max(2, Math.ceil(Math.sqrt(remainingCams)));
      const totalCols = 2 + minColsForRemaining; // 2 c?t cho presenter + c?t cho các cam còn l?i
      const totalRows = Math.max(2, Math.ceil((remainingCams + 4) / totalCols)); // +4 vì presenter chi?m 4 cells
      
      // Tính kích thu?c cell d?a trên grid m?i
      const gutterTotalWidth = (totalCols - 1) * gridGutter;
      const gutterTotalHeight = (totalRows - 1) * gridGutter;
      const usableWidth = canvasWidth - gutterTotalWidth;
      const usableHeight = canvasHeight - gutterTotalHeight;
      let cellWidth = Math.floor(usableWidth / totalCols);
      let cellHeight = Math.ceil(cellWidth / ASPECT_RATIO);
      if ((cellHeight * totalRows) > usableHeight) {
        cellHeight = Math.floor(usableHeight / totalRows);
        cellWidth = Math.ceil(cellHeight * ASPECT_RATIO);
      }
      
      optimalGrid = {
        columns: totalCols,
        rows: totalRows,
        width: (cellWidth * totalCols) + gutterTotalWidth,
        height: (cellHeight * totalRows) + gutterTotalHeight,
        filledArea: (cellWidth * cellHeight) * (remainingCams + 4),
      };
    } else {
      // Logic cu cho tru?ng h?p không có presenter
      let adjustedNumItems = numItems;
      if (hasFocusedItem) {
        adjustedNumItems += 3;
      }
      
      optimalGrid = range(1, adjustedNumItems + 1)
        .reduce((currentGrid, col) => {
          const testGrid = findOptimalGrid(
            canvasWidth, canvasHeight, gridGutter,
            ASPECT_RATIO, adjustedNumItems, col,
          );
          const focusedConstraint = hasFocusedItem ? testGrid.rows > 1 && testGrid.columns > 1 : true;
          const betterThanCurrent = testGrid.filledArea > currentGrid.filledArea;
          return (focusedConstraint && betterThanCurrent) ? testGrid : currentGrid;
        }, { filledArea: 0 });
    }
    layoutContextDispatch({
      type: ACTIONS.SET_CAMERA_DOCK_OPTIMAL_GRID_SIZE,
      value: {
        width: optimalGrid.width,
        height: optimalGrid.height,
      },
    });
    this.setState({
      optimalGrid,
    });
  }

  displayPageButtons() {
    const { numberOfPages, cameraDock } = this.props;
    const { width: cameraDockWidth } = cameraDock;

    if (!VideoService.isPaginationEnabled() || numberOfPages <= 1 || cameraDockWidth === 0) {
      return false;
    }

    return true;
  }

  renderNextPageButton() {
    const {
      intl,
      numberOfPages,
      currentVideoPageIndex,
      cameraDock,
    } = this.props;
    const { position } = cameraDock;

    if (!this.displayPageButtons()) return null;

    const currentPage = currentVideoPageIndex + 1;
    const nextPageLabel = intl.formatMessage(intlMessages.nextPageLabel);
    const nextPageDetailedLabel = `${nextPageLabel} (${currentPage}/${numberOfPages})`;

    return (
      <Styled.NextPageButton
        role="button"
        aria-label={nextPageLabel}
        color="primary"
        icon="right_arrow"
        size="md"
        onClick={VideoService.getNextVideoPage}
        label={nextPageDetailedLabel}
        hideLabel
        position={position}
        data-test="nextPageVideoPaginationBtn"
      />
    );
  }

  renderPreviousPageButton() {
    const {
      intl,
      currentVideoPageIndex,
      numberOfPages,
      cameraDock,
    } = this.props;
    const { position } = cameraDock;

    if (!this.displayPageButtons()) return null;

    const currentPage = currentVideoPageIndex + 1;
    const prevPageLabel = intl.formatMessage(intlMessages.prevPageLabel);
    const prevPageDetailedLabel = `${prevPageLabel} (${currentPage}/${numberOfPages})`;

    return (
      <Styled.PreviousPageButton
        role="button"
        aria-label={prevPageLabel}
        color="primary"
        icon="left_arrow"
        size="md"
        onClick={VideoService.getPreviousVideoPage}
        label={prevPageDetailedLabel}
        hideLabel
        position={position}
        data-test="previousPageVideoPaginationBtn"
      />
    );
  }

  // Render video item (dùng chung cho strip và stage)
  renderVideoItem(item: VideoItem, isInStrip: boolean = false) {
    const {
      onVirtualBgDrop,
      onVideoItemMount,
      onVideoItemUnmount,
      handleVideoFocus,
      setUserCamerasRequestedFromPlugin,
      focusedId,
      pluginUserCameraHelperPerPosition,
      streams,
    } = this.props;
    const numOfStreams = streams.length;
    const { userId, name } = item;
    const isStream = item.type !== VIDEO_TYPES.GRID;
    const anyItem = item as any;
    const isPresenter = isStream
      ? anyItem?.user?.presenter
      : item.type === VIDEO_TYPES.GRID
        ? anyItem?.presenter
        : false;
    const stream = isStream ? item.stream : null;
    const key = isStream ? stream : userId;
    const isFocused = isStream && focusedId === stream && numOfStreams > 2;

    const videoItem = (
      <VideoListItemContainer
        pluginUserCameraHelperPerPosition={pluginUserCameraHelperPerPosition}
        numOfStreams={numOfStreams}
        cameraId={stream}
        userId={userId}
        name={name}
        focused={isFocused}
        isStream={isStream}
        setUserCamerasRequestedFromPlugin={setUserCamerasRequestedFromPlugin}
        onHandleVideoFocus={isStream ? handleVideoFocus : null}
        onVideoItemMount={(videoRef) => {
          this.handleCanvasResize();
          if (isStream) onVideoItemMount(item.stream, videoRef);
        }}
        stream={item}
        onVideoItemUnmount={onVideoItemUnmount}
        onVirtualBgDrop={
          (type, name, data) => {
            return isStream ? onVirtualBgDrop(item.stream, type, name, data) : Promise.resolve(null);
          }
        }
      />
    );

    // N?u trong strip, b?c v?i VideoStripItem
    if (isInStrip) {
      return (
        <Styled.VideoStripItem
          key={key}
          $isPresenter={isPresenter}
        >
          {videoItem}
        </Styled.VideoStripItem>
      );
    }

    // N?u ? stage (presenter l?n), b?c v?i PresenterStageVideo
    const { hasSidebarOpen } = this.props;
    return (
      <Styled.PresenterStageVideo key={key} $hasSidebarOpen={hasSidebarOpen}>
        {videoItem}
      </Styled.PresenterStageVideo>
    );
  }

  // Handler cho wheel scroll trên strip
  handleStripWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const strip = e.currentTarget;
    e.preventDefault();
    strip.scrollLeft += e.deltaY;
    // Update scroll buttons sau khi scroll
    setTimeout(() => {
      this.updateScrollButtons();
    }, 50);
  };

  // Handler cho drag scroll - mouse down
  handleStripMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.stripRef.current) return;
    
    const target = e.target as HTMLElement;
    
    // Không drag nếu click vào video, button, hoặc các element tương tác
    if (
      target.tagName === 'VIDEO' ||
      target.tagName === 'BUTTON' ||
      target.closest('video') ||
      target.closest('button') ||
      target.closest('[data-test="webcamItem"]') ||
      target.closest('[data-test="webcamItemTalkingUser"]')
    ) {
      return;
    }
    
    // Bắt đầu drag
    this.isDragging = true;
    this.dragStartX = e.pageX;
    this.dragStartScrollLeft = this.stripRef.current.scrollLeft;
    
    // Thay đổi cursor và prevent text selection
    if (this.stripRef.current) {
      this.stripRef.current.style.cursor = 'grabbing';
      this.stripRef.current.style.userSelect = 'none';
    }
    
    e.preventDefault();
    e.stopPropagation();
  }

  // Handler cho drag scroll - mouse move
  handleStripMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.isDragging || !this.stripRef.current) return;
    
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - this.dragStartX) * 1.5; // Tốc độ scroll (có thể điều chỉnh)
    this.stripRef.current.scrollLeft = this.dragStartScrollLeft - walk;
    
    // Update scroll buttons
    this.updateScrollButtons();
  }

  // Handler cho drag scroll - mouse up
  handleStripMouseUp() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // Khôi phục cursor
    if (this.stripRef.current) {
      this.stripRef.current.style.cursor = 'grab';
      this.stripRef.current.style.userSelect = '';
    }
  }

  // Handler cho drag scroll - mouse leave (khi chuột ra khỏi vùng)
  handleStripMouseLeave() {
    // Không cần làm gì, global handlers sẽ xử lý
  }

  // Global mouse move handler (để drag hoạt động khi chuột ra ngoài VideoStrip)
  handleGlobalMouseMove(e: MouseEvent) {
    if (!this.isDragging || !this.stripRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    const x = e.pageX;
    const walk = (x - this.dragStartX) * 1.5; // Tốc độ scroll (có thể điều chỉnh)
    this.stripRef.current.scrollLeft = this.dragStartScrollLeft - walk;
    
    // Update scroll buttons
    this.updateScrollButtons();
  }

  // Global mouse up handler (để kết thúc drag khi chuột ra ngoài VideoStrip)
  handleGlobalMouseUp() {
    if (this.isDragging) {
      this.handleStripMouseUp();
    }
  }

  // Update scroll buttons visibility
  updateScrollButtons() {
    if (!this.stripRef.current) return;
    
    const strip = this.stripRef.current;
    const canScrollLeft = strip.scrollLeft > 0;
    const canScrollRight = strip.scrollLeft < (strip.scrollWidth - strip.clientWidth - 1);
    
    this.setState({
      canScrollLeft,
      canScrollRight,
    });
  }

  // Handler scroll left (scroll sang trái để xem phần bên trái)
  handleScrollLeft() {
    if (!this.stripRef.current) return;
    
    const strip = this.stripRef.current;
    // Scroll qua 1 cam (khoảng 140px + gap) - scroll sang trái
    const scrollAmount = 150;
    strip.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    
    setTimeout(() => {
      this.updateScrollButtons();
    }, 300);
  }

  // Handler scroll right (scroll sang phải để xem phần bên phải)
  handleScrollRight() {
    if (!this.stripRef.current) return;
    
    const strip = this.stripRef.current;
    // Scroll qua 1 cam (khoảng 140px + gap) - scroll sang phải
    const scrollAmount = 150;
    strip.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    
    setTimeout(() => {
      this.updateScrollButtons();
    }, 300);
  }

  renderVideoList() {
    const { streams, focusedId, hasSharedContent } = this.props;

    // 1) Uu tiên focusedId làm ngu?n stage (d?m b?o m?i client th?y gi?ng nhau)
    let stageStream = streams.find((item) => {
      const anyItem = item as any;
      return item.type !== VIDEO_TYPES.GRID && anyItem?.stream === focusedId;
    });

    // 2) N?u chua có, fallback sang presenter / moderator / stream d?u tiên
    if (!stageStream) {
      stageStream = streams.find((item) => {
        const anyItem = item as any;
        if (item.type === VIDEO_TYPES.STREAM && anyItem?.user?.presenter) return true;
        if (item.type === VIDEO_TYPES.GRID && anyItem?.presenter) return true;
        if (anyItem?.user?.role === 'MODERATOR' || anyItem?.role === 'MODERATOR') return true;
        return false;
      }) || streams[0];
    }

    return (
      <Styled.CustomLayoutContainer $hasSharedContent={hasSharedContent}>
        {/* Khung trung tâm to - chỉ hiển thị khi không share content */}
        {!hasSharedContent && (
          <Styled.MainStage>
            {/* Hiển thị cam lớn hoặc placeholder */}
            {stageStream && this.renderVideoItem(stageStream, false)}
            {!stageStream && (
              <Styled.StagePlaceholder>Chờ presenter...</Styled.StagePlaceholder>
            )}
          </Styled.MainStage>
        )}
      </Styled.CustomLayoutContainer>
    );
  }

  renderVideoStrip() {
    const { streams, hasSharedContent, hasSidebarOpen } = this.props;
    const { canScrollLeft, canScrollRight } = this.state;

    // Strip: gi? t?t c? streams, s?p x?p presenter lên d?u
    const sortedStripStreams = [...streams].sort((a, b) => {
      const anyA = a as any;
      const anyB = b as any;

      const aIsPresenter = (a.type === VIDEO_TYPES.STREAM && anyA?.user?.presenter)
        || (a.type === VIDEO_TYPES.GRID && anyA?.presenter)
        || (anyA?.user?.role === 'MODERATOR' || anyA?.role === 'MODERATOR');

      const bIsPresenter = (b.type === VIDEO_TYPES.STREAM && anyB?.user?.presenter)
        || (b.type === VIDEO_TYPES.GRID && anyB?.presenter)
        || (anyB?.user?.role === 'MODERATOR' || anyB?.role === 'MODERATOR');

      if (aIsPresenter && !bIsPresenter) return -1;
      if (!aIsPresenter && bIsPresenter) return 1;
      return 0;
    });

    return (
      <Styled.VideoStripWrapper>
        {canScrollLeft && (
          <Styled.ScrollArrow
            $position="left"
            onClick={this.handleScrollLeft}
            role="button"
            aria-label="Scroll left to see more"
          >
            <Icon iconName="left_arrow" />
          </Styled.ScrollArrow>
        )}
        <Styled.VideoStrip
          ref={this.stripRef}
          $hasSharedContent={hasSharedContent}
          $hasSidebarOpen={hasSidebarOpen}
          onWheel={this.handleStripWheel}
          onScroll={this.updateScrollButtons}
          onMouseDown={this.handleStripMouseDown}
        >
          {sortedStripStreams.map((item) => this.renderVideoItem(item, true))}
        </Styled.VideoStrip>
        {canScrollRight && (
          <Styled.ScrollArrow
            $position="right"
            onClick={this.handleScrollRight}
            role="button"
            aria-label="Scroll right to see more"
          >
            <Icon iconName="right_arrow" />
          </Styled.ScrollArrow>
        )}
      </Styled.VideoStripWrapper>
    );
  }

  render() {
    const {
      streams,
      intl,
      cameraDock,
      mediaArea,
      isGridEnabled,
    } = this.props;
    const { autoplayBlocked } = this.state;
    const { position, width: cameraDockWidth } = cameraDock;
    const mediaWidth = mediaArea?.width || cameraDockWidth || undefined;

    // Render VideoStrip bằng React Portal ra ngoài DOM tree (vào body)
    // để không bị ảnh hưởng bởi container width khi sidebar mở
    const videoStripElement = !streams.length && !isGridEnabled 
      ? null 
      : createPortal(
          this.renderVideoStrip(),
          document.body, // Render trực tiếp vào body để không bị ảnh hưởng bởi bất kỳ container nào
        );

    return (
      <>
        {/* VideoStrip render bằng Portal ra ngoài DOM tree để luôn full màn hình */}
        {videoStripElement}
        
        <Styled.VideoCanvas
          $position={position}
          ref={(ref) => {
            this.canvas = ref;
          }}
          style={{
            minHeight: 'inherit',
            // Ràng buộc chiều rộng khung video theo media area mà layout đã tính
            // để khi sidebar mở/zoom, MainStage + dropdown cam luôn co lại theo
            maxWidth: mediaWidth,
          }}
        >
          {/* Layout m?i: Strip + Stage (không dùng grid cu n?a) */}
          {!streams.length && !isGridEnabled ? null : this.renderVideoList()}

          {!autoplayBlocked ? null : (
            <AutoplayOverlay
              autoplayBlockedDesc={intl.formatMessage(intlMessages.autoplayBlockedDesc)}
              autoplayAllowLabel={intl.formatMessage(intlMessages.autoplayAllowLabel)}
              handleAllowAutoplay={this.handleAllowAutoplay}
            />
          )}
        </Styled.VideoCanvas>
      </>
    );
  }
}

export default injectIntl(VideoList);
