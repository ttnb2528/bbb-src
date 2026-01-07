import { useEffect, useRef } from 'react';
import { throttle } from '/imports/utils/throttle';
import { debounce } from '/imports/utils/debounce';
import { layoutSelect, layoutSelectInput, layoutDispatch } from '/imports/ui/components/layout/context';
import DEFAULT_VALUES from '/imports/ui/components/layout/defaultValues';
import { INITIAL_INPUT_STATE } from '/imports/ui/components/layout/initState';
import { ACTIONS, CAMERADOCK_POSITION, LAYOUT_TYPE, PANELS } from '../enums';
import Storage from '/imports/ui/services/storage/session';
import { defaultsDeep } from '/imports/utils/array-utils';
import Session from '/imports/ui/services/storage/in-memory';

// Improved window size functions that account for browser zoom
const windowWidth = () => {
  // Use visualViewport if available (better zoom handling)
  if (window.visualViewport) {
    return window.visualViewport.width;
  }
  return window.document.documentElement.clientWidth;
};

const windowHeight = () => {
  // Use visualViewport if available (better zoom handling)
  if (window.visualViewport) {
    return window.visualViewport.height;
  }
  return window.document.documentElement.clientHeight;
};

const min = (value1, value2) => (value1 <= value2 ? value1 : value2);
const max = (value1, value2) => (value1 >= value2 ? value1 : value2);

// Clamp value between min and max
const clamp = (value, minVal, maxVal) => Math.min(Math.max(value, minVal), maxVal);

const CustomLayout = (props) => {
  const {
    bannerAreaHeight, calculatesActionbarHeight, calculatesNavbarHeight, isMobile,
    prevLayout,
  } = props;

  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }

  const input = layoutSelect((i) => i.input);
  const deviceType = layoutSelect((i) => i.deviceType);
  const isRTL = layoutSelect((i) => i.isRTL);
  const fullscreen = layoutSelect((i) => i.fullscreen);
  const fontSize = layoutSelect((i) => i.fontSize);
  const currentPanelType = layoutSelect((i) => i.currentPanelType);
  // Track browser size changes to trigger layout recalculation on zoom
  const browserSize = layoutSelect((i) => i.input.browser);

  const presentationInput = layoutSelectInput((i) => i.presentation);
  const externalVideoInput = layoutSelectInput((i) => i.externalVideo);
  const genericMainContentInput = layoutSelectInput((i) => i.genericMainContent);
  const screenShareInput = layoutSelectInput((i) => i.screenShare);
  const sharedNotesInput = layoutSelectInput((i) => i.sharedNotes);

  const sidebarNavigationInput = layoutSelectInput((i) => i.sidebarNavigation);
  const sidebarContentInput = layoutSelectInput((i) => i.sidebarContent);
  const cameraDockInput = layoutSelectInput((i) => i.cameraDock);
  const actionbarInput = layoutSelectInput((i) => i.actionBar);
  const navbarInput = layoutSelectInput((i) => i.navBar);
  const layoutContextDispatch = layoutDispatch();

  const { isResizing } = cameraDockInput;

  const prevDeviceType = usePrevious(deviceType);
  const prevIsResizing = usePrevious(isResizing);
  const { isPresentationEnabled } = props;

  const throttledCalculatesLayout = throttle(() => calculatesLayout(),
    50, { trailing: true, leading: true });

  // Improved resize handler with visualViewport support for better zoom handling
  // This handler updates browser size AND triggers layout recalculation immediately
  useEffect(() => {
    const handleResize = throttle(() => {
      // Use visualViewport if available (better zoom handling)
      const width = window.visualViewport?.width || window.document.documentElement.clientWidth;
      const height = window.visualViewport?.height || window.document.documentElement.clientHeight;
      
      // Update browser size in context
      layoutContextDispatch({
        type: ACTIONS.SET_BROWSER_SIZE,
        value: {
          width,
          height,
        },
      });
      
      // IMPORTANT: Trigger layout recalculation immediately after browser size change
      // This ensures layout updates right away when zooming, not waiting for other triggers
      throttledCalculatesLayout();
    }, 50, { trailing: true, leading: true }); // Reduced throttle to 50ms for more responsive zoom

    // Listen to both resize and visualViewport resize events
    window.addEventListener('resize', handleResize);
    
    // Use visualViewport API if available for better zoom handling
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, [layoutContextDispatch, throttledCalculatesLayout]);

  useEffect(() => {
    if (deviceType === null) return () => null;

    if (deviceType !== prevDeviceType) {
      // reset layout if deviceType changed
      // not all options is supported in all devices
      init();
    } else {
      throttledCalculatesLayout();
    }
  }, [
    input,
    deviceType,
    isRTL,
    fontSize,
    fullscreen,
    isPresentationEnabled,
    browserSize,
    // Khi sidebar (chat / user list) mở / đóng, cần force recalc ngay để tránh bug phải zoom mới update
    sidebarContentInput.isOpen,
  ]); // Added browserSize to trigger recalculation on zoom

  const calculatesDropAreas = (sidebarNavWidth, sidebarContentWidth, cameraDockBounds) => {
    const { height: actionBarHeight } = calculatesActionbarHeight();
    const mediaAreaHeight = windowHeight() - (DEFAULT_VALUES.navBarHeight + actionBarHeight);
    const mediaAreaWidth = windowWidth() - (sidebarNavWidth + sidebarContentWidth);
    const DROP_ZONE_DEFAUL_SIZE = 100;
    const dropZones = {};
    const sidebarSize = sidebarNavWidth + sidebarContentWidth;

    dropZones[CAMERADOCK_POSITION.CONTENT_TOP] = {
      top: DEFAULT_VALUES.navBarHeight,
      left: !isRTL ? sidebarSize : null,
      right: isRTL ? sidebarSize : null,
      width: mediaAreaWidth,
      height: DROP_ZONE_DEFAUL_SIZE,
      zIndex: cameraDockBounds.zIndex,
    };

    dropZones[CAMERADOCK_POSITION.CONTENT_RIGHT] = {
      top: DEFAULT_VALUES.navBarHeight + DROP_ZONE_DEFAUL_SIZE,
      left: !isRTL ? windowWidth() - DROP_ZONE_DEFAUL_SIZE : 0,
      height: mediaAreaHeight - 2 * DROP_ZONE_DEFAUL_SIZE,
      width: DROP_ZONE_DEFAUL_SIZE,
      zIndex: cameraDockBounds.zIndex,
    };

    dropZones[CAMERADOCK_POSITION.CONTENT_BOTTOM] = {
      top: DEFAULT_VALUES.navBarHeight + mediaAreaHeight - DROP_ZONE_DEFAUL_SIZE,
      left: !isRTL ? sidebarSize : null,
      right: isRTL ? sidebarSize : null,
      width: mediaAreaWidth,
      height: DROP_ZONE_DEFAUL_SIZE,
      zIndex: cameraDockBounds.zIndex,
    };

    dropZones[CAMERADOCK_POSITION.CONTENT_LEFT] = {
      top: DEFAULT_VALUES.navBarHeight + DROP_ZONE_DEFAUL_SIZE,
      left: !isRTL ? sidebarSize : null,
      right: isRTL ? sidebarSize : null,
      height: mediaAreaHeight - 2 * DROP_ZONE_DEFAUL_SIZE,
      width: DROP_ZONE_DEFAUL_SIZE,
      zIndex: cameraDockBounds.zIndex,
    };

    dropZones[CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM] = {
      top: windowHeight() - DROP_ZONE_DEFAUL_SIZE,
      left: !isRTL ? sidebarNavWidth : null,
      right: isRTL ? sidebarNavWidth : null,
      width: sidebarContentWidth,
      height: DROP_ZONE_DEFAUL_SIZE,
      zIndex: cameraDockBounds.zIndex,
    };

    return dropZones;
  };

  const init = () => {
    const hasLayoutEngineLoadedOnce = Session.getItem('hasLayoutEngineLoadedOnce');
    if (isMobile) {
      layoutContextDispatch({
        type: ACTIONS.SET_LAYOUT_INPUT,
        value: (prevInput) => {
          const {
            sidebarNavigation, sidebarContent, presentation, cameraDock,
            externalVideo, genericMainContent, screenShare, sharedNotes,
          } = prevInput;
          const { sidebarContentPanel } = sidebarContent;
          return defaultsDeep(
            {
              sidebarNavigation: {
                // Luôn ẩn sidebar-navigation vì đã gộp vào sidebar-content
                isOpen: false,
                sidebarNavPanel: sidebarNavigation.sidebarNavPanel,
              },
              sidebarContent: {
                // Khi lần đầu load, luôn set isOpen = false, sau đó dùng transform để ẩn/hiện
                isOpen: hasLayoutEngineLoadedOnce 
                  ? (sidebarContentPanel !== PANELS.NONE)
                  : false,
                sidebarContentPanel: sidebarContent.sidebarContentPanel,
              },
              presentation: {
                isOpen: presentation.isOpen,
                slidesLength: presentation.slidesLength,
                currentSlide: {
                  ...presentation.currentSlide,
                },
              },
              cameraDock: {
                position: cameraDock.position || DEFAULT_VALUES.cameraPosition,
                numCameras: cameraDock.numCameras,
              },
              externalVideo: {
                hasExternalVideo: externalVideo.hasExternalVideo,
              },
              genericMainContent: {
                genericContentId: genericMainContent.genericContentId,
              },
              screenShare: {
                hasScreenShare: screenShare.hasScreenShare,
                width: screenShare.width,
                height: screenShare.height,
              },
              sharedNotes: {
                isPinned: sharedNotes.isPinned,
              },
            },
            hasLayoutEngineLoadedOnce ? prevInput : INITIAL_INPUT_STATE,
          );
        },
      });
    } else {
      layoutContextDispatch({
        type: ACTIONS.SET_LAYOUT_INPUT,
        value: (prevInput) => {
          const {
            sidebarNavigation, sidebarContent, presentation, cameraDock,
            externalVideo, genericMainContent, screenShare, sharedNotes,
          } = prevInput;
          const { sidebarContentPanel } = sidebarContent;
          let sidebarContentPanelOverride = sidebarContentPanel;
          // Khi lần đầu load, không override isOpen, để sidebar ẩn theo initState
          let overrideOpenSidebarPanel = hasLayoutEngineLoadedOnce 
            ? (sidebarContentPanel !== PANELS.NONE)
            : false;
          let overrideOpenSidebarNavigation = hasLayoutEngineLoadedOnce
            ? (sidebarNavigation.isOpen || sidebarContentPanel !== PANELS.NONE || false)
            : false;
          if (prevLayout === LAYOUT_TYPE.CAMERAS_ONLY
            || prevLayout === LAYOUT_TYPE.PRESENTATION_ONLY
            || prevLayout === LAYOUT_TYPE.MEDIA_ONLY) {
            // Chỉ override khi đã load trước đó
            if (hasLayoutEngineLoadedOnce) {
              overrideOpenSidebarNavigation = true;
              overrideOpenSidebarPanel = true;
              sidebarContentPanelOverride = PANELS.CHAT;
            }
          }
          // Ensure sidebar navigation is open when sidebar content is open (chỉ khi đã load trước đó)
          if (overrideOpenSidebarPanel && hasLayoutEngineLoadedOnce) {
            overrideOpenSidebarNavigation = true;
          }
          return defaultsDeep(
            {
              sidebarNavigation: {
                // Khi lần đầu load, luôn set isOpen = false
                isOpen: hasLayoutEngineLoadedOnce ? overrideOpenSidebarNavigation : false,
              },
              sidebarContent: {
                // Khi lần đầu load, luôn set isOpen = false
                isOpen: hasLayoutEngineLoadedOnce ? overrideOpenSidebarPanel : false,
                sidebarContentPanel: sidebarContentPanelOverride,
              },
              presentation: {
                isOpen: presentation.isOpen,
                slidesLength: presentation.slidesLength,
                currentSlide: {
                  ...presentation.currentSlide,
                },
              },
              cameraDock: {
                position: cameraDock.position || DEFAULT_VALUES.cameraPosition,
                numCameras: cameraDock.numCameras,
              },
              externalVideo: {
                hasExternalVideo: externalVideo.hasExternalVideo,
              },
              genericMainContent: {
                genericContentId: genericMainContent.genericContentId,
              },
              screenShare: {
                hasScreenShare: screenShare.hasScreenShare,
                width: screenShare.width,
                height: screenShare.height,
              },
              sharedNotes: {
                isPinned: sharedNotes.isPinned,
              },
            },
            hasLayoutEngineLoadedOnce ? prevInput : INITIAL_INPUT_STATE,
          );
        },
      });
    }
    Session.setItem('layoutReady', true);
    throttledCalculatesLayout();
  };

  const calculatesSidebarContentHeight = (cameraDockHeight) => {
    const { isOpen, slidesLength } = presentationInput;
    const { hasExternalVideo } = externalVideoInput;
    const { genericContentId } = genericMainContentInput;
    const { hasScreenShare } = screenShareInput;
    const { isPinned: isSharedNotesPinned } = sharedNotesInput;

    const hasPresentation = isPresentationEnabled && slidesLength !== 0;
    const isGeneralMediaOff = !hasPresentation && !hasExternalVideo
      && !hasScreenShare && !isSharedNotesPinned && !genericContentId;

    let sidebarContentHeight = 0;
    if (sidebarContentInput.isOpen) {
      if (isMobile) {
        sidebarContentHeight = windowHeight() - DEFAULT_VALUES.navBarHeight;
      } else if (
        cameraDockInput.numCameras > 0 &&
        cameraDockInput.position === CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM &&
        isOpen &&
        !isGeneralMediaOff
      ) {
        sidebarContentHeight = windowHeight() - cameraDockHeight;
      } else {
        sidebarContentHeight = windowHeight();
      }
      sidebarContentHeight -= bannerAreaHeight();
    }
    return sidebarContentHeight;
  };

  const calculatesCameraDockBounds = (sidebarNavWidth, sidebarContentWidth, mediaAreaBounds) => {
    const { baseCameraDockBounds } = props;
    const sidebarSize = sidebarNavWidth + sidebarContentWidth;

    const baseBounds = baseCameraDockBounds(mediaAreaBounds, sidebarSize);

    // do not proceed if using values from LayoutEngine
    if (Object.keys(baseBounds).length > 0) {
      return baseBounds;
    }

    const {
      camerasMargin,
      cameraDockMinHeight,
      cameraDockMinWidth,
      presentationToolbarMinWidth,
    } = DEFAULT_VALUES;

    const navBarHeight = calculatesNavbarHeight();
    // Khi camera ở trên, dùng navBarHeight = 0 để camera sát trên cùng
    // Trên mobile: đẩy camera lên sát trên bằng cách set top = 0 (giống như đã fix trên laptop)
    const effectiveNavBarHeight = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_TOP 
      ? (isMobile ? 0 : 0)  // Mobile: top = 0 để sát trên cùng (giống laptop)
      : (isMobile ? navBarHeight - 20 : navBarHeight); // Mobile: giảm 20px để đẩy lên

    const cameraDockBounds = {};

    let cameraDockHeight = 0;
    let cameraDockWidth = 0;

    const lastSize = Storage.getItem('webcamSize') || { width: 0, height: 0 };
    let { width: lastWidth, height: lastHeight } = lastSize;

    if (cameraDockInput.isDragging) cameraDockBounds.zIndex = 99;
    else {
      // Check if external video is active - if so, lower camera z-index so video appears on top
      const { hasExternalVideo: hasExtVideo } = externalVideoInput;
      if (hasExtVideo) {
        cameraDockBounds.zIndex = 1; // Lower z-index when external video is active
      } else {
        cameraDockBounds.zIndex = 10; // Tăng z-index để camera hiển thị trên document
      }
    }

    const isCameraTop = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_TOP;
    const isCameraBottom = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_BOTTOM;
    const isCameraLeft = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_LEFT;
    const isCameraRight = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_RIGHT;
    const isCameraSidebar = cameraDockInput.position === CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM;

    const stoppedResizing = prevIsResizing && !isResizing;
    if (stoppedResizing) {
      const isCameraTopOrBottom =
        cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_TOP ||
        cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_BOTTOM;

      Storage.setItem('webcamSize', {
        width: isCameraTopOrBottom || isCameraSidebar ? lastWidth : cameraDockInput.width,
        height: isCameraTopOrBottom || isCameraSidebar ? cameraDockInput.height : lastHeight,
      });

      const updatedLastSize = Storage.getItem('webcamSize');
      lastWidth = updatedLastSize.width;
      lastHeight = updatedLastSize.height;
    }

    if (isCameraTop || isCameraBottom) {
      if ((lastHeight === 0 && !isResizing) || (isCameraTop && isMobile)) {
        // Trên mobile: sử dụng height cố định khớp với CSS (120px tablet, 100px phone)
        // Desktop: tính theo tỷ lệ như cũ
        if (isMobile && isCameraTop) {
          // Improved responsive calculation using viewport-relative units
          // Use viewport-relative calculation: ~8vh for phone, ~10vh for tablet
          // This scales better with browser zoom
          const windowW = windowWidth();
          const viewportHeight = windowHeight();
          cameraDockHeight = windowW < 480 
            ? Math.max(100, viewportHeight * 0.08) // Phone: min 100px or 8vh
            : Math.max(120, viewportHeight * 0.10); // Tablet: min 120px or 10vh
        } else {
          // Desktop: use percentage-based calculation with constraints
          // Min 15% of viewport, max 30% of viewport, clamped between minHeight and available space
          const minHeightPercent = 0.15;
          const maxHeightPercent = 0.30;
          const calculatedHeight = mediaAreaBounds.height * 0.2; // Default 20%
          cameraDockHeight = clamp(
            calculatedHeight,
            Math.max(cameraDockMinHeight, mediaAreaBounds.height * minHeightPercent),
            Math.min(mediaAreaBounds.height * maxHeightPercent, mediaAreaBounds.height - cameraDockMinHeight)
          );
        }
      } else {
        // Use saved height but clamp it to ensure it's within bounds
        const height = isResizing ? cameraDockInput.height : lastHeight;
        const minAllowedHeight = Math.max(cameraDockMinHeight, mediaAreaBounds.height * 0.10);
        const maxAllowedHeight = Math.min(mediaAreaBounds.height * 0.40, mediaAreaBounds.height - cameraDockMinHeight);
        cameraDockHeight = clamp(height, minAllowedHeight, maxAllowedHeight);
      }

      // Khi camera ở trên: đặt sát lên trên cùng (top = 0) để giảm khoảng trống phía trên
      // Trên mobile: top = 0 để sát trên cùng (giống như đã fix trên laptop)
      cameraDockBounds.top = isMobile && isCameraTop ? 0 : effectiveNavBarHeight;
      cameraDockBounds.left = mediaAreaBounds.left;
      cameraDockBounds.right = isRTL ? sidebarSize : null;
      
      // Improved width constraints: ensure minimum usable width
      const minUsableWidth = Math.max(320, mediaAreaBounds.width * 0.5); // At least 320px or 50% of available width
      cameraDockBounds.minWidth = minUsableWidth;
      cameraDockBounds.width = mediaAreaBounds.width;
      cameraDockBounds.maxWidth = mediaAreaBounds.width;
      
      // Improved height constraints: ensure reasonable min/max
      cameraDockBounds.minHeight = Math.max(cameraDockMinHeight, mediaAreaBounds.height * 0.10);
      cameraDockBounds.height = cameraDockHeight;
      cameraDockBounds.maxHeight = Math.min(mediaAreaBounds.height * 0.80, mediaAreaBounds.height - 100); // Max 80% or leave 100px for other content

      if (isCameraBottom) {
        // Trên mobile: đẩy camera bottom lên cao hơn một chút
        const bottomOffset = isMobile ? -40 : 0; // Mobile: đẩy lên 40px
        cameraDockBounds.top += mediaAreaBounds.height - cameraDockHeight + bottomOffset;
      }

      return cameraDockBounds;
    }

    if (isCameraLeft || isCameraRight) {
      if (lastWidth === 0 && !isResizing) {
        cameraDockWidth = min(
          max(mediaAreaBounds.width * 0.2, cameraDockMinWidth),
          mediaAreaBounds.width - cameraDockMinWidth
        );
      } else {
        const width = isResizing ? cameraDockInput.width : lastWidth;
        cameraDockWidth = min(
          max(width, cameraDockMinWidth),
          mediaAreaBounds.width - cameraDockMinWidth
        );
      }

      // Trên mobile: đẩy camera lên cao hơn
      const topOffset = isMobile ? -30 : 0; // Mobile: đẩy lên 30px
      cameraDockBounds.top = navBarHeight + bannerAreaHeight() + topOffset;
      cameraDockBounds.minWidth = cameraDockMinWidth;
      cameraDockBounds.width = cameraDockWidth;
      cameraDockBounds.maxWidth = mediaAreaBounds.width * 0.8;
      cameraDockBounds.presenterMaxWidth =
        mediaAreaBounds.width - presentationToolbarMinWidth - camerasMargin;
      cameraDockBounds.minHeight = cameraDockMinHeight;
      cameraDockBounds.height = mediaAreaBounds.height;
      cameraDockBounds.maxHeight = mediaAreaBounds.height;
      // button size in vertical position
      cameraDockBounds.height -= 20;

      if (isCameraRight) {
        const sizeValue = mediaAreaBounds.left + mediaAreaBounds.width - cameraDockWidth;
        cameraDockBounds.left = !isRTL ? sizeValue - camerasMargin : 0;
        cameraDockBounds.right = isRTL ? sizeValue + sidebarSize - camerasMargin : null;
      } else if (isCameraLeft) {
        cameraDockBounds.left = mediaAreaBounds.left + camerasMargin;
        cameraDockBounds.right = isRTL ? sidebarSize + camerasMargin * 2 : null;
      }

      return cameraDockBounds;
    }

    if (isCameraSidebar) {
      if (lastHeight === 0 && !isResizing) {
        cameraDockHeight = min(
          max(windowHeight() * 0.2, cameraDockMinHeight),
          windowHeight() - cameraDockMinHeight
        );
      } else {
        const height = isResizing ? cameraDockInput.height : lastHeight;
        cameraDockHeight = min(
          max(height, cameraDockMinHeight),
          windowHeight() - cameraDockMinHeight
        );
      }

      // Trên mobile: đẩy camera sidebar lên cao hơn
      const sidebarTopOffset = isMobile ? -40 : 0; // Mobile: đẩy lên 40px
      cameraDockBounds.top = windowHeight() - cameraDockHeight - bannerAreaHeight() + sidebarTopOffset;
      cameraDockBounds.left = !isRTL ? sidebarNavWidth : 0;
      cameraDockBounds.right = isRTL ? sidebarNavWidth : 0;
      cameraDockBounds.minWidth = sidebarContentWidth;
      cameraDockBounds.width = sidebarContentWidth;
      cameraDockBounds.maxWidth = sidebarContentWidth;
      cameraDockBounds.minHeight = cameraDockMinHeight;
      cameraDockBounds.height = cameraDockHeight;
      cameraDockBounds.maxHeight = windowHeight() * 0.8;
    }
    return cameraDockBounds;
  };

  const calculatesMediaBounds = (
    sidebarNavWidth,
    sidebarContentWidth,
    cameraDockBounds,
    mediaAreaBoundsFromLayout,
  ) => {
    const { isOpen, slidesLength } = presentationInput;
    const { hasExternalVideo } = externalVideoInput;
    const { genericContentId } = genericMainContentInput;
    const { hasScreenShare } = screenShareInput;
    const { isPinned: isSharedNotesPinned } = sharedNotesInput;

    const { height: actionBarHeight } = calculatesActionbarHeight();
    const navBarHeight = 0; // NavBar is always hidden now - features moved to footer
    // sidebarPanelHeight used to reserve space for a horizontal panel above footer.
    // Layout mới: sidebar đã chuyển sang bên phải, không còn panel ngang cố định nữa,
    // nên KHÔNG cần trừ sidebarPanelHeight khỏi chiều cao media area.
    const localSidebarPanelHeight = 0;
    const bannerHeight = isMobile ? 0 : bannerAreaHeight(); // Mobile: no banner space
    const panelButtonsHeight = isMobile ? 80 : 0; // Space for mobile panel buttons (tăng lên để phù hợp với padding và gap mới)

    // Ưu tiên dùng mediaAreaBounds đã được tính (đã trừ sidebar width/gutter)
    const mediaAreaWidth = mediaAreaBoundsFromLayout?.width ?? windowWidth();
    const mediaAreaHeight = mediaAreaBoundsFromLayout?.height
      ?? (windowHeight() - (actionBarHeight + bannerHeight + localSidebarPanelHeight + panelButtonsHeight)); // No navbar height, add panel buttons space on mobile
    const mediaAreaTop = mediaAreaBoundsFromLayout?.top ?? (navBarHeight + bannerHeight);

    const mediaBounds = {};
    const { element: fullscreenElement } = fullscreen;
    const { camerasMargin } = DEFAULT_VALUES;

    const hasPresentation = (isPresentationEnabled && slidesLength !== 0) || isOpen;
    const isGeneralMediaOff = !hasPresentation && !hasExternalVideo
      && !hasScreenShare && !isSharedNotesPinned && !genericContentId;

    if (!isOpen || isGeneralMediaOff) {
      mediaBounds.width = 0;
      mediaBounds.height = 0;
      mediaBounds.top = 0;
      mediaBounds.left = !isRTL ? 0 : null;
      mediaBounds.right = isRTL ? 0 : null;
      mediaBounds.zIndex = 0;
      return mediaBounds;
    }

    if (
      fullscreenElement === 'Presentation' ||
      fullscreenElement === 'Screenshare' ||
      fullscreenElement === 'ExternalVideo' ||
      fullscreenElement === 'GenericContent'
    ) {
      mediaBounds.width = windowWidth();
      mediaBounds.height = windowHeight();
      mediaBounds.top = 0;
      mediaBounds.left = !isRTL ? 0 : null;
      mediaBounds.right = isRTL ? 0 : null;
      mediaBounds.zIndex = 99;
      return mediaBounds;
    }

    const sharedContentOpen = hasPresentation || hasExternalVideo || hasScreenShare || genericContentId;
    
    // Khi có camera và document: giữ camera ở vị trí cũ, di chuyển document xuống dưới camera
    // Document giữ kích thước tối đa, không bị bóp
    if (cameraDockInput.numCameras > 0 && !cameraDockInput.isDragging && sharedContentOpen) {
      const isCameraTop = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_TOP;
      const isCameraBottom = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_BOTTOM;
      const isCameraSidebar = cameraDockInput.position === CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM;
      const isCameraLeft = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_LEFT;
      const isCameraRight = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_RIGHT;
      
      if (isCameraTop) {
        // Camera ở trên (VideoStrip): Presentation nằm trong MainStage, giống camera lớn
        // Đồng bộ top với sidebar để document và sidebar cùng một mức
        const videoStripReserve = 120; // Chiều cao dự phòng cho strip cam nhỏ (khớp với CSS)
        const gap = 12; // Gap giữa strip và content (khớp với sidebar)
        mediaBounds.width = mediaAreaWidth;
        // Presentation chiếm height còn lại sau khi trừ phần dành cho strip
        mediaBounds.height = mediaAreaHeight - videoStripReserve - gap;
        // Presentation top đồng bộ với sidebar top: bannerHeight + videoStripReserve + gap
        // Để document và sidebar cùng một mức
        mediaBounds.top = bannerHeight + videoStripReserve + gap;
        mediaBounds.left = !isRTL ? 0 : null;
        mediaBounds.right = isRTL ? 0 : null;
        
        // Z-index thấp hơn VideoStrip để VideoStrip overlay lên trên
        // VideoStrip có z-index cao hơn (được set trong cameraDockBounds z-index: 10)
        mediaBounds.zIndex = 1;
      } else if (isCameraBottom) {
        // Camera ở dưới: document chiếm phần trên, camera ở dưới
        mediaBounds.width = mediaAreaWidth;
        mediaBounds.height = mediaAreaHeight - cameraDockBounds.height - camerasMargin;
        mediaBounds.top = mediaAreaTop;
        mediaBounds.left = !isRTL ? 0 : null;
        mediaBounds.right = isRTL ? 0 : null;
        mediaBounds.zIndex = 1;
      } else if (isCameraLeft || isCameraRight) {
        // Camera ở bên trái hoặc phải: document chiếm phần còn lại, giữ kích thước tối đa
        mediaBounds.width = mediaAreaWidth - cameraDockBounds.width - camerasMargin * 2;
        mediaBounds.height = mediaAreaHeight;
        mediaBounds.top = mediaAreaTop;
        if (isCameraLeft) {
          mediaBounds.left = !isRTL ? (cameraDockBounds.width + camerasMargin * 2) : null;
          mediaBounds.right = isRTL ? 0 : null;
        } else {
          mediaBounds.left = !isRTL ? 0 : null;
          mediaBounds.right = isRTL ? (cameraDockBounds.width + camerasMargin * 2) : null;
        }
        mediaBounds.zIndex = 1;
      } else if (isCameraSidebar) {
        // Camera ở sidebar: document chiếm toàn bộ không gian (camera không ảnh hưởng)
        mediaBounds.width = mediaAreaWidth;
        mediaBounds.height = mediaAreaHeight;
        mediaBounds.top = mediaAreaTop;
        mediaBounds.left = !isRTL ? 0 : null;
        mediaBounds.right = isRTL ? 0 : null;
        mediaBounds.zIndex = 1;
      } else {
        // Vị trí khác: document giữ nguyên kích thước đầy đủ
        mediaBounds.width = mediaAreaWidth;
        mediaBounds.height = mediaAreaHeight;
        mediaBounds.top = mediaAreaTop;
        mediaBounds.left = !isRTL ? 0 : null;
        mediaBounds.right = isRTL ? 0 : null;
        mediaBounds.zIndex = 1;
      }
    } else if (cameraDockInput.numCameras > 0 && !cameraDockInput.isDragging) {
      // Có camera nhưng không có document: giữ nguyên logic cũ
      mediaBounds.width = mediaAreaWidth;
      mediaBounds.height = mediaAreaHeight;
      mediaBounds.top = mediaAreaTop;
      mediaBounds.left = !isRTL ? 0 : null;
      mediaBounds.right = isRTL ? 0 : null;
      mediaBounds.zIndex = 1;
    } else {
      // Không có camera: đưa document về giữa màn hình hoặc đẩy xuống một chút
      mediaBounds.width = mediaAreaWidth;
      mediaBounds.height = mediaAreaHeight;
      // Đẩy document xuống một chút từ top để căn giữa màn hình
      // Trên mobile: đẩy lên một chút (offset âm) để document không quá thấp
      // Trên desktop: offset lớn hơn để ở giữa màn hình
      const topOffset = isMobile ? 0 : 80; // Mobile: -20px (đẩy lên), Desktop: 80px
      mediaBounds.top = mediaAreaTop + topOffset;
      mediaBounds.left = !isRTL ? 0 : null;
      mediaBounds.right = isRTL ? 0 : null;
      mediaBounds.zIndex = 1;
    }

    return mediaBounds;
  };

  const calculatesLayout = () => {
    const {
      calculatesNavbarBounds,
      calculatesActionbarBounds,
      calculatesSidebarNavWidth,
      calculatesSidebarNavHeight,
      calculatesSidebarNavBounds,
      calculatesSidebarContentWidth,
      calculatesSidebarContentBounds,
      calculatesMediaAreaBounds,
      isTablet,
    } = props;
    const { position: cameraPosition } = cameraDockInput;
    const { camerasMargin, captionsMargin } = DEFAULT_VALUES;


    // Fixed height for horizontal sidebar panel above footer (legacy behaviour).
    // Layout mới: sidebar đã chuyển sang bên phải (sidebar-content), không còn panel ngang cố định nữa.
    // Để video chiếm tối đa chiều cao giống Google Meet, KHÔNG trừ sidebarPanelHeight khỏi media area.
    const sidebarPanelHeight = 0;

    // Tab-based sidebar: sidebar-navigation đã được gộp vào sidebar-content
    // Luôn set sidebarNavWidth = 0 vì không còn sidebar riêng nữa
    const sidebarNavWidth = 0; // Đã gộp vào sidebar-content với tabs
    const sidebarNavHeight = calculatesSidebarNavHeight();
    // calculatesSidebarContentWidth trả về object { minWidth, width, maxWidth }
    const sidebarContentWidthObj = calculatesSidebarContentWidth();
    const sidebarContentWidth = sidebarContentWidthObj?.width || 0;

    // Xác định trạng thái sidebar thực tế (khi panel Users/Chat/Notes đang được chọn)
    const hasSidebarPanel = sidebarContentInput.sidebarContentPanel !== PANELS.NONE;
    const isSidebarOpen = !isMobile && (sidebarContentInput.isOpen || hasSidebarPanel);

    // Sidebar desktop: target width cố định ~360px (giống Meet), có clamp để không quá to
    const targetSidebarWidth = clamp(
      360,
      300,
      420,
    );
    // Nếu layout chưa có width lưu lại, dùng target cố định; luôn clamp để tránh phá vỡ khi zoom
    const effectiveSidebarWidth = isSidebarOpen
      ? clamp(sidebarContentWidth || targetSidebarWidth, 280, 440)
      : 0;
    // Media area bounds: full width, no sidebars on left (they're horizontal at bottom now)
    // Hide navbar to give more space for video and allow sidebar to span full width
    // Ensure minimum usable dimensions to prevent layout breaking
    const minMediaAreaWidth = 320; // Minimum usable width
    const minMediaAreaHeight = 200; // Minimum usable height

    const viewportWidth = windowWidth();
    const viewportHeight = windowHeight();
    // Khi sidebar (chat/user list) mở trên desktop: trừ width của sidebar (effectiveSidebarWidth)
    // Thêm gutter (khoảng cách) giữa video và sidebar để đẹp hơn, giống Google Meet
    // Gutter scale nhẹ theo viewport, có clamp để ổn định khi zoom in/out
    const sidebarGutter = clamp(
      viewportWidth * 0.008, // ~0.8% viewport
      8, // min
      14, // max
    );
    
    // Tính width đúng: trừ sidebar width và gutter khi sidebar mở
    // Đồng thời clamp theo tỷ lệ để video không chiếm quá nhiều hoặc quá ít khi zoom
    const mediaWidthMinRatio = 0.55; // không nhỏ hơn ~55% viewport
    const mediaWidthMaxRatio = 0.8; // không lớn hơn ~80% viewport (co thêm khi zoom cao)
    const safetyPadding = 16; // trừ thêm để tránh dính sidebar ở 150% zoom
    const mediaAreaWidth = isSidebarOpen
      ? clamp(
        viewportWidth - effectiveSidebarWidth - sidebarGutter - safetyPadding,
        Math.max(minMediaAreaWidth, viewportWidth * mediaWidthMinRatio),
        Math.max(minMediaAreaWidth, viewportWidth * mediaWidthMaxRatio),
      )
      : Math.max(viewportWidth, minMediaAreaWidth);
    
    // Tính height: trừ actionBar, banner, panelButtons (mobile)
    const tempActionBarHeight = calculatesActionbarHeight();
    const tempActionBarFinalHeight = isMobile 
      ? Math.max(tempActionBarHeight.height, windowWidth() < 480 ? 72 : 75)
      : tempActionBarHeight.height;
    const bannerHeight = isMobile ? 0 : bannerAreaHeight();
    const panelButtonsHeight = isMobile ? 80 : 0;
    
    const mediaAreaBounds = {
      width: mediaAreaWidth,
      height: Math.max(
        viewportHeight - tempActionBarFinalHeight - sidebarPanelHeight - bannerHeight - panelButtonsHeight,
        minMediaAreaHeight
      ),
      top: isMobile ? 0 : bannerHeight, // Trên mobile: top = 0 để sát trên cùng
      left: 0, // Video luôn bắt đầu từ mép trái
    };
    const navbarBounds = calculatesNavbarBounds(mediaAreaBounds);
    const actionbarBounds = calculatesActionbarBounds(mediaAreaBounds);
    const cameraDockBounds = calculatesCameraDockBounds(
      0, // sidebarNavWidth = 0 (đã gộp)
      effectiveSidebarWidth, // chỉ tính sidebar-content width thực tế đang chiếm chỗ
      mediaAreaBounds,
    );
    const dropZoneAreas = calculatesDropAreas(
      0, // sidebarNavWidth = 0
      effectiveSidebarWidth, // sidebarContentWidth thực tế
      cameraDockBounds,
    );
    const sidebarContentHeight = calculatesSidebarContentHeight(cameraDockBounds.height);
    const mediaBounds = calculatesMediaBounds(
      0, // sidebarNavWidth = 0
      effectiveSidebarWidth, // sidebarContentWidth thực tế
      cameraDockBounds,
      mediaAreaBounds,
    );
    const { height: actionBarHeight } = calculatesActionbarHeight();

    let horizontalCameraDiff = 0;

    if (cameraPosition === CAMERADOCK_POSITION.CONTENT_LEFT) {
      horizontalCameraDiff = cameraDockBounds.width + camerasMargin * 2;
    }

    if (cameraPosition === CAMERADOCK_POSITION.CONTENT_RIGHT) {
      horizontalCameraDiff = camerasMargin * 2;
    }

    // Hide navbar completely - all features moved to footer
    layoutContextDispatch({
      type: ACTIONS.SET_NAVBAR_OUTPUT,
      value: {
        display: false, // Always hide navbar - features are in footer now
        width: navbarBounds.width,
        height: navbarBounds.height,
        top: navbarBounds.top,
        left: navbarBounds.left,
        tabOrder: DEFAULT_VALUES.navBarTabOrder,
        zIndex: navbarBounds.zIndex,
      },
    });

    // Tăng height và z-index cho mobile để không bị che
    // Tính padding bottom thực tế trên mobile (16px cho tablet, 14px cho phone)
    const mobilePaddingBottom = isMobile ? (windowWidth() < 480 ? 14 : 16) : 0;
    const actionBarFinalHeight = isMobile 
      ? Math.max(actionbarBounds.height, windowWidth() < 480 ? 72 : 75) // Phone (< 480px): 72px, Tablet/Mobile: 75px (tăng thêm)
      : actionbarBounds.height;
    
    // Điều chỉnh top position để tính đến padding bottom thực tế trên mobile
    // Nếu height tăng lên, cần điều chỉnh top để footer không bị thụt
    const actionBarFinalTop = isMobile 
      ? windowHeight() - actionBarFinalHeight // Tính lại top dựa trên height mới
      : actionbarBounds.top;
    
    layoutContextDispatch({
      type: ACTIONS.SET_ACTIONBAR_OUTPUT,
      value: {
        display: actionbarInput.hasActionBar,
        width: windowWidth(), // Footer luôn full width, không bị giới hạn bởi mediaAreaBounds
        height: actionBarFinalHeight, // Sử dụng height đã điều chỉnh
        innerHeight: actionbarBounds.innerHeight,
        top: actionBarFinalTop, // Sử dụng top đã điều chỉnh
        left: 0, // Footer luôn bắt đầu từ mép trái để full width
        padding: actionbarBounds.padding,
        tabOrder: DEFAULT_VALUES.actionBarTabOrder,
        zIndex: 1000, // Tăng z-index cao để không bị che
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_CAPTIONS_OUTPUT,
      value: {
        left: !isRTL ? captionsMargin : null,
        right: isRTL ? captionsMargin : null,
        maxWidth: windowWidth() - captionsMargin * 2,
      },
    });

    // Calculate new position for sidebar navigation (User List panel - separate panel)
    const sidebarNavTop = windowHeight() - actionBarHeight - sidebarPanelHeight;
    const sidebarNavLeft = 0;
    const sidebarNavNewHeight = sidebarPanelHeight;
    // User List panel: responsive width, allow resize
    const windowW = windowWidth();
    let defaultUserListWidth, minUserListWidth, maxUserListWidth;
    if (isMobile) {
      // Mobile: full width hoặc ẩn
      defaultUserListWidth = windowW;
      minUserListWidth = windowW;
      maxUserListWidth = windowW;
    } else {
      defaultUserListWidth = windowW < 1280 ? 260 : windowW < 1920 ? 300 : 350;
      minUserListWidth = 200;
      maxUserListWidth = Math.min(windowW * 0.4, 450);
    }
    // Use existing width if available, otherwise use default
    const sidebarNavNewWidth = sidebarNavigationInput.width || defaultUserListWidth;
    // Calculate minHeight and maxHeight for collapse/expand functionality
    const minUserListHeight = 52; // Collapsed height
    // Tăng maxHeight đáng kể để user list có thể expand cao hơn, hiển thị nhiều user hơn
    const maxUserListHeight = Math.min(windowHeight() * 0.75, windowHeight() - actionBarHeight - 20);

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_NAVIGATION_OUTPUT,
      value: {
        display: false, // Luôn ẩn vì đã gộp vào sidebar-content - không còn sidebar trái nữa
        minWidth: minUserListWidth,
        width: sidebarNavNewWidth,
        maxWidth: maxUserListWidth,
        minHeight: minUserListHeight,
        height: sidebarNavNewHeight,
        maxHeight: maxUserListHeight,
        top: sidebarNavTop,
        left: sidebarNavLeft,
        right: sidebarContentRight,
        tabOrder: DEFAULT_VALUES.sidebarNavTabOrder,
        isResizable: false, // Tắt tính năng resize sidebar
        zIndex: 10,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_NAVIGATION_RESIZABLE_EDGE,
      value: {
        top: false,
        right: false, // Tắt resize từ right edge
        bottom: false,
        left: false, // Tắt resize từ left edge
      },
    });

    // Calculate new position for sidebar content (Chat/Notes panel - separate panel, on the right side)
    // Sidebar bắt đầu từ top (sau banner nếu có) và kéo xuống đến trên action bar
    // Dùng lại bannerHeight đã được khai báo ở trên (dòng 749)
    // Đặt sidebar xuống sát footer, chừa khoảng cho dải cam nhỏ ở trên
    const videoStripReserve = 120; // chiều cao dự phòng cho strip cam nhỏ (đã giảm còn 90-140 ở CSS)
    const sidebarContentTop = bannerHeight + videoStripReserve + 12; // chừa strip + gap
    const sidebarContentNewHeight = windowHeight() - bannerHeight - actionBarHeight - videoStripReserve - 16; // trừ thêm gap
    // Chat panel nằm ở bên phải màn hình, tách biệt với user panel
    const sidebarContentLeft = isMobile ? 0 : null; // Desktop: đặt từ right edge
    const sidebarContentRight = isMobile ? null : 0; // Desktop: nằm sát bên phải
    // Chat/Notes panel: width cố định nhỏ gọn
    // QUAN TRỌNG: Dùng sidebarContentWidth đã được tính từ calculatesSidebarContentWidth để đảm bảo đồng bộ
    const sidebarContentNewWidth = sidebarContentWidth || (isMobile ? windowWidth() : 350); // Fallback nếu sidebarContentWidth = 0
    const minChatNotesWidth = isMobile ? windowWidth() : 300; // Mobile: full width
    const maxChatNotesWidth = isMobile ? windowWidth() : 450; // Max width cho desktop
    // Calculate minHeight and maxHeight for collapse/expand functionality
    const minChatNotesHeight = 52; // Collapsed height
    // Tăng chiều cao tối đa để hiển thị nhiều tin nhắn hơn
    // Tăng chiều cao tối đa lên cao hơn nữa để hiển thị nhiều tin nhắn hơn
    const maxChatNotesHeight = Math.min(windowHeight() * 0.85, windowHeight() - actionBarHeight - 10);

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_OUTPUT,
      value: {
        // Mobile: ẩn panel Chat/Notes ở dưới, user có thể mở qua private chat modal
        display: isMobile ? false : true,
        minWidth: minChatNotesWidth,
        width: sidebarContentNewWidth,
        maxWidth: maxChatNotesWidth, // Max width cố định cho desktop
        minHeight: minChatNotesHeight,
        height: sidebarContentNewHeight,
        maxHeight: maxChatNotesHeight,
        top: sidebarContentTop,
        left: sidebarContentLeft,
        right: sidebarContentRight,
        currentPanelType,
        tabOrder: DEFAULT_VALUES.sidebarContentTabOrder,
        isResizable: false, // Tắt tính năng resize sidebar
        zIndex: 10,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_RESIZABLE_EDGE,
      value: {
        top: false,
        right: false, // Tắt resize từ right edge
        bottom: false,
        left: false, // Tắt resize từ left edge
      },
    });

    // Media area now takes full width (no sidebars on left), but subtract height for horizontal sidebar panel
    // No navbar height since we hide it
    // Mobile: no banner height either
    // Mobile: subtract extra space for panel buttons (approximately 80px)
    // Sử dụng actionBarFinalHeight thay vì actionBarHeight để tính đúng height của footer
    // bannerHeight and panelButtonsHeight already declared above (line 579, 582), reuse them
    const finalActionBarHeight = isMobile ? actionBarFinalHeight : actionBarHeight;
    const mediaAreaNewHeight = windowHeight() - finalActionBarHeight - sidebarPanelHeight - bannerHeight - panelButtonsHeight;

    layoutContextDispatch({
      type: ACTIONS.SET_MEDIA_AREA_SIZE,
      value: {
        width: windowWidth(),
        height: mediaAreaNewHeight,
      },
    });

    const isMediaOpen = mediaBounds?.width > 0 && mediaBounds?.height > 0;

    // Priority: external video > document > camera
    // Hide camera dock (large camera in center) when external video or document is displayed
    // But keep small camera on top (CONTENT_TOP position) visible
    const { hasExternalVideo } = externalVideoInput;
    const { isOpen: isPresentationOpen, slidesLength } = presentationInput;
    // Only hide camera dock if:
    // 1. External video is active, OR
    // 2. Presentation is open AND has slides AND media is actually being displayed
    // But keep camera visible if it's in CONTENT_TOP position (small camera on top)
    const hasPresentation = isPresentationOpen && (isPresentationEnabled && slidesLength !== 0) && isMediaOpen;
    // For external video: hide all camera docks except CONTENT_TOP (small camera on top)
    // For document: same behavior - hide large cameras, keep small one on top
    // Check if camera is large (not in CONTENT_TOP) - large cameras should be hidden
    const isCameraTop = cameraDockInput.position === CAMERADOCK_POSITION.CONTENT_TOP;
    // Check if external video is active - use hasExternalVideo directly (it's set by external video player)
    // Don't require isMediaOpen check for external video as it might not be set correctly
    const externalVideoActive = hasExternalVideo;
    const shouldHideCameraDock = (externalVideoActive || hasPresentation) && !isCameraTop;

    layoutContextDispatch({
      type: ACTIONS.SET_CAMERA_DOCK_OUTPUT,
      value: {
        display: cameraDockInput.numCameras > 0 && !shouldHideCameraDock,
        position: cameraDockInput.position,
        minWidth: cameraDockBounds.minWidth,
        width: cameraDockBounds.width,
        maxWidth: cameraDockBounds.maxWidth,
        presenterMaxWidth: cameraDockBounds.presenterMaxWidth,
        minHeight: cameraDockBounds.minHeight,
        height: cameraDockBounds.height,
        maxHeight: cameraDockBounds.maxHeight,
        top: cameraDockBounds.top,
        left: cameraDockBounds.left,
        right: cameraDockBounds.right,
        tabOrder: 4,
        isDraggable: !isMobile && !isTablet && presentationInput.isOpen,
        resizableEdge: {
          top:
          isMediaOpen
            && (input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_BOTTOM
            || (input.cameraDock.position === CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM
            && input.sidebarContent.isOpen)),
          right:
            isMediaOpen
            && ((!isRTL && input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_LEFT)
            || (isRTL && input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_RIGHT)),
          bottom: isMediaOpen && input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_TOP,
          left:
          isMediaOpen
            && ((!isRTL && input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_RIGHT)
            || (isRTL && input.cameraDock.position === CAMERADOCK_POSITION.CONTENT_LEFT)),
        },
        zIndex: cameraDockBounds.zIndex,
        focusedId: input.cameraDock.focusedId,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_DROP_AREAS,
      value: dropZoneAreas,
    });

    layoutContextDispatch({
      type: ACTIONS.SET_PRESENTATION_OUTPUT,
      value: {
        display: presentationInput.isOpen,
        width: mediaBounds.width,
        height: mediaBounds.height,
        top: mediaBounds.top,
        left: mediaBounds.left,
        right: isRTL ? mediaBounds.right + horizontalCameraDiff : null,
        tabOrder: DEFAULT_VALUES.presentationTabOrder,
        isResizable: false,
        zIndex: mediaBounds.zIndex,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SCREEN_SHARE_OUTPUT,
      value: {
        width: mediaBounds.width,
        height: mediaBounds.height,
        top: mediaBounds.top,
        left: mediaBounds.left,
        right: isRTL ? mediaBounds.right + horizontalCameraDiff : null,
        zIndex: mediaBounds.zIndex,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_EXTERNAL_VIDEO_OUTPUT,
      value: {
        display: externalVideoInput.hasExternalVideo,
        width: mediaBounds.width,
        height: mediaBounds.height,
        top: mediaBounds.top,
        left: mediaBounds.left,
        right: isRTL ? mediaBounds.right + horizontalCameraDiff : null,
      },
    });
    
    layoutContextDispatch({
      type: ACTIONS.SET_GENERIC_CONTENT_OUTPUT,
      value: {
        width: mediaBounds.width,
        height: mediaBounds.height,
        top: mediaBounds.top,
        left: mediaBounds.left,
        right: isRTL ? mediaBounds.right + horizontalCameraDiff : null,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SHARED_NOTES_OUTPUT,
      value: {
        width: mediaBounds.width,
        height: mediaBounds.height,
        top: mediaBounds.top,
        left: mediaBounds.left,
        right: isRTL ? mediaBounds.right + horizontalCameraDiff : null,
      },
    });
  };

  return null;
};

export default CustomLayout;