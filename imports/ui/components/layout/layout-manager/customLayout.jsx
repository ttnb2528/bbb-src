import { useEffect, useRef } from 'react';
import { throttle } from '/imports/utils/throttle';
import { layoutSelect, layoutSelectInput, layoutDispatch } from '/imports/ui/components/layout/context';
import DEFAULT_VALUES from '/imports/ui/components/layout/defaultValues';
import { INITIAL_INPUT_STATE } from '/imports/ui/components/layout/initState';
import { ACTIONS, CAMERADOCK_POSITION, LAYOUT_TYPE, PANELS } from '../enums';
import Storage from '/imports/ui/services/storage/session';
import { defaultsDeep } from '/imports/utils/array-utils';
import Session from '/imports/ui/services/storage/in-memory';

const windowWidth = () => window.document.documentElement.clientWidth;
const windowHeight = () => window.document.documentElement.clientHeight;
const min = (value1, value2) => (value1 <= value2 ? value1 : value2);
const max = (value1, value2) => (value1 >= value2 ? value1 : value2);

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

  useEffect(() => {
    window.addEventListener('resize', () => {
      layoutContextDispatch({
        type: ACTIONS.SET_BROWSER_SIZE,
        value: {
          width: window.document.documentElement.clientWidth,
          height: window.document.documentElement.clientHeight,
        },
      });
    });
  }, []);

  useEffect(() => {
    if (deviceType === null) return () => null;

    if (deviceType !== prevDeviceType) {
      // reset layout if deviceType changed
      // not all options is supported in all devices
      init();
    } else {
      throttledCalculatesLayout();
    }
  }, [input, deviceType, isRTL, fontSize, fullscreen, isPresentationEnabled]);

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
                isOpen:
                  sidebarNavigation.isOpen || sidebarContentPanel !== PANELS.NONE || false,
                sidebarNavPanel: sidebarNavigation.sidebarNavPanel,
              },
              sidebarContent: {
                isOpen: sidebarContentPanel !== PANELS.NONE,
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
          let overrideOpenSidebarPanel = sidebarContentPanel !== PANELS.NONE;
          let overrideOpenSidebarNavigation = sidebarNavigation.isOpen
            || sidebarContentPanel !== PANELS.NONE || false;
          if (prevLayout === LAYOUT_TYPE.CAMERAS_ONLY
            || prevLayout === LAYOUT_TYPE.PRESENTATION_ONLY
            || prevLayout === LAYOUT_TYPE.MEDIA_ONLY) {
            overrideOpenSidebarNavigation = true;
            overrideOpenSidebarPanel = true;
            sidebarContentPanelOverride = PANELS.CHAT;
          }
          // Ensure sidebar navigation is open when sidebar content is open
          if (overrideOpenSidebarPanel) {
            overrideOpenSidebarNavigation = true;
          }
          return defaultsDeep(
            {
              sidebarNavigation: {
                isOpen: overrideOpenSidebarNavigation,
              },
              sidebarContent: {
                isOpen: overrideOpenSidebarPanel,
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
    else cameraDockBounds.zIndex = 10; // Tăng z-index để camera hiển thị trên document

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
          // Khớp với CSS height: tablet 120px, phone 100px
          const windowW = windowWidth();
          cameraDockHeight = windowW < 480 ? 100 : 120; // Phone: 100px, Tablet: 120px
        } else {
          cameraDockHeight = min(
            max(mediaAreaBounds.height * 0.2, cameraDockMinHeight),
            mediaAreaBounds.height - cameraDockMinHeight
          );
        }
      } else {
        const height = isResizing ? cameraDockInput.height : lastHeight;
        cameraDockHeight = min(
          max(height, cameraDockMinHeight),
          mediaAreaBounds.height - cameraDockMinHeight
        );
      }

      // Khi camera ở trên: đặt sát lên trên cùng (top = 0) để giảm khoảng trống phía trên
      // Trên mobile: top = 0 để sát trên cùng (giống như đã fix trên laptop)
      cameraDockBounds.top = isMobile && isCameraTop ? 0 : effectiveNavBarHeight;
      cameraDockBounds.left = mediaAreaBounds.left;
      cameraDockBounds.right = isRTL ? sidebarSize : null;
      cameraDockBounds.minWidth = mediaAreaBounds.width;
      cameraDockBounds.width = mediaAreaBounds.width;
      cameraDockBounds.maxWidth = mediaAreaBounds.width;
      cameraDockBounds.minHeight = cameraDockMinHeight;
      cameraDockBounds.height = cameraDockHeight;
      cameraDockBounds.maxHeight = mediaAreaBounds.height * 0.8;

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

  const calculatesMediaBounds = (sidebarNavWidth, sidebarContentWidth, cameraDockBounds) => {
    const { isOpen, slidesLength } = presentationInput;
    const { hasExternalVideo } = externalVideoInput;
    const { genericContentId } = genericMainContentInput;
    const { hasScreenShare } = screenShareInput;
    const { isPinned: isSharedNotesPinned } = sharedNotesInput;

    const { height: actionBarHeight } = calculatesActionbarHeight();
    const navBarHeight = 0; // NavBar is always hidden now - features moved to footer
    // sidebarPanelHeight is defined in calculatesLayout, use a local constant here
    // Use responsive height matching calculatesLayout
    const windowH = windowHeight();
    // Trên mobile: không trừ sidebarPanelHeight vì nó đã được ẩn hoặc không ảnh hưởng
    const localSidebarPanelHeight = isMobile ? 0 : (windowH < 800 ? 180 : windowH < 1080 ? 200 : 220);
    const bannerHeight = isMobile ? 0 : bannerAreaHeight(); // Mobile: no banner space
    const panelButtonsHeight = isMobile ? 80 : 0; // Space for mobile panel buttons (tăng lên để phù hợp với padding và gap mới)
    const mediaAreaHeight =
      windowHeight() - (actionBarHeight + bannerHeight + localSidebarPanelHeight + panelButtonsHeight); // No navbar height, add panel buttons space on mobile
    const mediaAreaWidth = windowWidth(); // Full width, no sidebars on left
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
        // Camera ở trên: document đặt xuống dưới camera, giữ kích thước đầy đủ (không bị bóp)
        // Document được đặt dưới camera với margin đủ để không bị đụng
        // Khi có camera, đẩy document lên cao hơn để tận dụng không gian tốt hơn
        const cameraTop = cameraDockBounds.top || navBarHeight;
        const cameraHeight = cameraDockBounds.height || 0;
        
        // Phát hiện document dọc (portrait) vs ngang (landscape)
        const documentAspectRatio = mediaAreaHeight / mediaAreaWidth;
        const isPortraitDocument = documentAspectRatio > 1.2; // Tỷ lệ > 1.2 được coi là dọc
        
        // Trên mobile: điều chỉnh để document được nâng lên cao hơn khi có camera
        let finalTop;
        if (isMobile) {
          const windowH = windowHeight();
          const { height: actionBarHeight } = calculatesActionbarHeight();
          const availableHeight = windowH - actionBarHeight;
          
          // Tính toán margin động dựa trên loại document và không gian còn lại
          let dynamicMargin = 5; // Margin tối thiểu để không overlap với camera
          
          // Kiểm tra thiết bị nhỏ (chiều cao < 700px) để đẩy lên cao hơn
          // windowH đã được khai báo ở trên, không cần khai báo lại
          const isSmallDevice = windowH < 700;
          
          if (isPortraitDocument) {
            // Document dọc: đẩy lên cao hơn nhiều để có thể xem được phần trên
            // Tính toán không gian còn lại sau camera
            const spaceAfterCamera = availableHeight - (cameraTop + cameraHeight);
            const documentHeight = mediaAreaHeight;
            
            // Nếu document cao hơn không gian còn lại, đẩy lên để có thể scroll xem
            if (documentHeight > spaceAfterCamera * 0.9) {
              // Document quá cao: đẩy lên cao nhất có thể (margin âm nhưng vẫn không overlap)
              // Trên thiết bị nhỏ, đẩy lên cao hơn nữa
              // Giảm xuống thêm 5px để hạ document xuống
              dynamicMargin = isSmallDevice ? -48 : -35; // Thiết bị nhỏ: -45px, bình thường: -35px
            } else {
              // Document vừa: đẩy lên một chút để tận dụng không gian
              // Trên thiết bị nhỏ, đẩy lên cao hơn nữa
              // Giảm xuống thêm 5px để hạ document xuống
              dynamicMargin = isSmallDevice ? -28 : -20; // Thiết bị nhỏ: -30px, bình thường: -20px
            }
          } else {
            // Document ngang: đẩy lên một chút
            // Trên thiết bị nhỏ, đẩy lên cao hơn nữa
            // Giảm xuống thêm 5px để hạ document xuống
            dynamicMargin = isSmallDevice ? -24 : -15; // Thiết bị nhỏ: -25px, bình thường: -15px
          }
          
          // Tính toán vị trí final, đảm bảo không overlap với camera
          const baseTop = cameraTop + cameraHeight;
          // Tính toán finalTop với dynamicMargin (có thể âm để đẩy lên cao)
          // Không cộng bannerHeight vào đây vì nó có thể làm tăng giá trị không mong muốn
          finalTop = baseTop + dynamicMargin;
          
          // Trên thiết bị nhỏ, đảm bảo document không che camera
          // Không cho phép overlap trên thiết bị nhỏ
          if (isSmallDevice) {
            // Thiết bị nhỏ: đảm bảo document bắt đầu sau camera với margin đủ
            // Tăng margin lên thêm 5px để đảm bảo document không che camera
            const minTop = baseTop + 20; // Tối thiểu 20px margin (tăng từ 15px) để không che camera
            if (finalTop < minTop) {
              finalTop = minTop;
            }
            // Trên thiết bị nhỏ, không cho phép margin âm để đảm bảo không che
            if (dynamicMargin < 0) {
              // Reset về margin dương nhỏ nhất
              finalTop = baseTop + 20;
            }
          } else {
            // Thiết bị lớn hơn: cho phép overlap một chút
            if (dynamicMargin < 0) {
              // Margin âm: cho phép overlap nhưng không quá nhiều
              const maxOverlap = 50; // Overlap tối đa 50px
              const minTop = baseTop - maxOverlap;
              if (finalTop < minTop) {
                finalTop = minTop;
              }
            } else {
              // Margin dương: đảm bảo không overlap
              const minTop = baseTop + 3; // Tối thiểu 3px margin
              if (finalTop < minTop) {
                finalTop = minTop;
              }
            }
          }
          
          // Đảm bảo document không bị overflow
          const maxTop = windowH - actionBarHeight - 20; // 20px padding bottom
          if (finalTop > maxTop) {
            finalTop = maxTop;
          }
          
          // QUAN TRỌNG: Trên thiết bị nhỏ, đảm bảo finalTop không bị override
          // Thêm bannerHeight sau khi đã tính toán xong để đảm bảo không bị ảnh hưởng bởi minTop/maxTop
          // Nhưng trên thiết bị nhỏ, đảm bảo margin tối thiểu sau camera vẫn được giữ
          if (isSmallDevice) {
            // Trên thiết bị nhỏ: đảm bảo sau khi cộng bannerHeight, vẫn có margin đủ
            const minTopAfterBanner = baseTop + 20 + bannerHeight;
            finalTop = finalTop + bannerHeight;
            // Nếu sau khi cộng bannerHeight mà vẫn chưa đủ margin, force lại
            if (finalTop < minTopAfterBanner) {
              finalTop = minTopAfterBanner;
            }
          } else {
            finalTop = finalTop + bannerHeight;
          }
        } else {
          // Desktop: thêm margin lớn hơn
          const minMargin = 28;
          finalTop = cameraTop + cameraHeight + minMargin + camerasMargin + bannerHeight;
        }
        
        mediaBounds.width = mediaAreaWidth;
        
        // Trên thiết bị nhỏ (như iPhone SE: 375x667), thu nhỏ document để vừa với không gian còn lại
        if (isMobile && isCameraTop) {
          const windowH = windowHeight();
          const { height: actionBarHeight } = calculatesActionbarHeight();
          const availableHeight = windowH - actionBarHeight;
          
          // Tính toán không gian còn lại sau finalTop
          // Đảm bảo document không bị che camera và không overflow
          const documentTop = finalTop;
          const spaceForDocument = availableHeight - documentTop;
          
          // Tính toán chiều cao tối đa cho document
          // Đảm bảo document vừa với không gian còn lại, không bị overflow
          if (windowH < 700) {
            // Thiết bị rất nhỏ (như iPhone SE): thu nhỏ document để vừa với không gian
            // Để lại margin (50px) để document không sát đáy và không che camera (tăng từ 40px)
            const maxDocumentHeight = Math.max(spaceForDocument - 68, 200); // 50px margin bottom, tối thiểu 200px
            
            // Luôn thu nhỏ document để vừa với không gian còn lại
            // Đảm bảo document không cao hơn không gian còn lại
            if (mediaAreaHeight > maxDocumentHeight) {
              // Thu nhỏ document để vừa với không gian
              mediaBounds.height = maxDocumentHeight;
            } else {
              // Nếu document nhỏ hơn không gian, vẫn đảm bảo không overflow
              const safeHeight = Math.max(spaceForDocument - 68, 200);
              mediaBounds.height = Math.min(mediaAreaHeight, safeHeight);
            }
          } else {
            // Thiết bị lớn hơn: giữ nguyên chiều cao nhưng đảm bảo không overflow
            const safeHeight = spaceForDocument - 20;
            mediaBounds.height = Math.min(mediaAreaHeight, safeHeight);
          }
          } else {
            // Desktop hoặc không có camera: giữ nguyên chiều cao
            mediaBounds.height = mediaAreaHeight;
          }
        
        // QUAN TRỌNG: Set finalTop vào mediaBounds.top
        // Trên thiết bị nhỏ, đảm bảo giá trị này không bị override bởi logic khác
        mediaBounds.top = finalTop;
        
        // Double-check trên thiết bị nhỏ: đảm bảo không bị override bởi bất kỳ logic nào khác
        if (isMobile && isCameraTop) {
          const windowH = windowHeight();
          const isSmallDeviceCheck = windowH < 700;
          if (isSmallDeviceCheck) {
            const baseTopCheck = cameraTop + cameraHeight;
            const minTopCheck = baseTopCheck + 20 + bannerHeight; // 20px margin + bannerHeight
            // Force đảm bảo margin tối thiểu - đây là safety check cuối cùng
            if (mediaBounds.top < minTopCheck) {
              mediaBounds.top = minTopCheck;
            }
          }
        }
        mediaBounds.left = !isRTL ? 0 : null;
        mediaBounds.right = isRTL ? 0 : null;
        
        // Z-index cao hơn camera để đảm bảo document hiển thị đúng
        mediaBounds.zIndex = 2;
      } else if (isCameraBottom) {
        // Camera ở dưới: document chiếm phần trên, camera ở dưới
        mediaBounds.width = mediaAreaWidth;
        mediaBounds.height = mediaAreaHeight - cameraDockBounds.height - camerasMargin;
        mediaBounds.top = navBarHeight + bannerHeight;
        mediaBounds.left = !isRTL ? 0 : null;
        mediaBounds.right = isRTL ? 0 : null;
        mediaBounds.zIndex = 1;
      } else if (isCameraLeft || isCameraRight) {
        // Camera ở bên trái hoặc phải: document chiếm phần còn lại, giữ kích thước tối đa
        mediaBounds.width = mediaAreaWidth - cameraDockBounds.width - camerasMargin * 2;
        mediaBounds.height = mediaAreaHeight;
        mediaBounds.top = navBarHeight + bannerHeight;
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
        mediaBounds.top = navBarHeight + bannerHeight;
        mediaBounds.left = !isRTL ? 0 : null;
        mediaBounds.right = isRTL ? 0 : null;
        mediaBounds.zIndex = 1;
      } else {
        // Vị trí khác: document giữ nguyên kích thước đầy đủ
        mediaBounds.width = mediaAreaWidth;
        mediaBounds.height = mediaAreaHeight;
        mediaBounds.top = navBarHeight + bannerHeight;
        mediaBounds.left = !isRTL ? 0 : null;
        mediaBounds.right = isRTL ? 0 : null;
        mediaBounds.zIndex = 1;
      }
    } else if (cameraDockInput.numCameras > 0 && !cameraDockInput.isDragging) {
      // Có camera nhưng không có document: giữ nguyên logic cũ
      mediaBounds.width = mediaAreaWidth;
      mediaBounds.height = mediaAreaHeight;
      mediaBounds.top = navBarHeight + bannerHeight;
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
      mediaBounds.top = navBarHeight + bannerHeight + topOffset;
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


    // Fixed height for horizontal sidebar panel above footer (optimized for better video space)
    // Use responsive height: smaller on smaller screens, but not too small to be unusable
    const windowH = windowHeight();
    // Mobile: ẩn hoặc giảm height đáng kể
    let sidebarPanelHeight;
    if (isMobile) {
      // Mobile: ẩn panel hoặc dùng height rất nhỏ
      sidebarPanelHeight = 0; // Hoặc có thể dùng 120 nếu muốn hiện nhưng nhỏ
    } else {
      // User panel giữ nguyên chiều cao cũ
      sidebarPanelHeight = windowH < 800 ? 180 : windowH < 1080 ? 200 : 220;
    }

    const sidebarNavWidth = calculatesSidebarNavWidth();
    const sidebarNavHeight = calculatesSidebarNavHeight();
    const sidebarContentWidth = calculatesSidebarContentWidth();
    // Media area bounds: full width, no sidebars on left (they're horizontal at bottom now)
    // Hide navbar to give more space for video and allow sidebar to span full width
    // Mobile: start from absolute top (0), no banner or navbar space
    // Mobile: subtract extra space for panel buttons (khoảng 80px với padding và gap mới)
    const bannerHeight = isMobile ? 0 : bannerAreaHeight();
    const panelButtonsHeight = isMobile ? 80 : 0; // Space for mobile panel buttons (tăng lên để phù hợp với padding và gap mới)
    // Tính actionBarFinalHeight trước để dùng cho mediaAreaBounds
    const tempActionBarHeight = calculatesActionbarHeight();
    const tempActionBarFinalHeight = isMobile 
      ? Math.max(tempActionBarHeight.height, windowWidth() < 480 ? 72 : 75) // Phone: 72px, Tablet/Mobile: 75px
      : tempActionBarHeight.height;
    // Trên mobile: đẩy media area lên sát trên (top = 0) để camera sát trên cùng (giống laptop)
    const mediaAreaTopOffset = isMobile ? 0 : 0; // Mobile: top = 0 để sát trên cùng
    const mediaAreaBounds = {
      width: windowWidth(),
      height: windowHeight() - tempActionBarFinalHeight - sidebarPanelHeight - bannerHeight - panelButtonsHeight,
      top: mediaAreaTopOffset, // Trên mobile: top = 0 để camera sát trên cùng
      left: 0,
    };
    const navbarBounds = calculatesNavbarBounds(mediaAreaBounds);
    const actionbarBounds = calculatesActionbarBounds(mediaAreaBounds);
    const cameraDockBounds = calculatesCameraDockBounds(
      0,
      0,
      mediaAreaBounds
    );
    const dropZoneAreas = calculatesDropAreas(
      0,
      0,
      cameraDockBounds
    );
    const sidebarContentHeight = calculatesSidebarContentHeight(cameraDockBounds.height);
    const mediaBounds = calculatesMediaBounds(
      0,
      0,
      cameraDockBounds
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
        width: actionbarBounds.width,
        height: actionBarFinalHeight, // Sử dụng height đã điều chỉnh
        innerHeight: actionbarBounds.innerHeight,
        top: actionBarFinalTop, // Sử dụng top đã điều chỉnh
        left: actionbarBounds.left,
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
    const maxUserListHeight = Math.min(windowHeight() * 0.5, windowHeight() - actionBarHeight - 20);

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_NAVIGATION_OUTPUT,
      value: {
        display: isMobile ? false : sidebarNavigationInput.isOpen, // Mobile: ẩn User List panel
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
        isResizable: !isMobile && !isTablet, // Allow resize for desktop
        zIndex: 10,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_NAVIGATION_RESIZABLE_EDGE,
      value: {
        top: false,
        right: !isRTL, // Allow resize from right edge
        bottom: false,
        left: isRTL,
      },
    });

    // Calculate new position for sidebar content (Chat/Notes panel - separate panel, on the right side)
    // Chat panel cao hơn user panel để hiển thị nhiều tin nhắn hơn
    // Dùng lại windowH đã được tính ở trên (dòng 564)
    // Tăng chiều cao lên cao hơn nữa
    const chatPanelHeight = isMobile ? 0 : (windowH < 800 ? 400 : windowH < 1080 ? 500 : 600);
    // Chat panel có thể cao hơn user panel, nên tính top dựa trên chat panel height
    const sidebarContentTop = windowHeight() - actionBarHeight - chatPanelHeight;
    // Chat panel nằm ở bên phải màn hình, tách biệt với user panel
    const sidebarContentLeft = isMobile ? 0 : null; // Desktop: đặt từ right edge
    const sidebarContentRight = isMobile ? null : 0; // Desktop: nằm sát bên phải
    // Chat/Notes panel: width cố định nhỏ gọn
    const sidebarContentNewWidth = isMobile ? windowWidth() : 350; // Width cố định cho desktop
    const sidebarContentNewHeight = chatPanelHeight;
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
        isResizable: !isMobile && !isTablet, // Allow resize for desktop
        zIndex: 10,
      },
    });

    layoutContextDispatch({
      type: ACTIONS.SET_SIDEBAR_CONTENT_RESIZABLE_EDGE,
      value: {
        top: false,
        right: !isRTL,
        bottom: false,
        left: !isRTL, // Allow resize from left edge (adjacent to User List)
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

    layoutContextDispatch({
      type: ACTIONS.SET_CAMERA_DOCK_OUTPUT,
      value: {
        display: cameraDockInput.numCameras > 0,
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