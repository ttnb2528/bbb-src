import { useEffect, useRef } from 'react';
import { throttle } from '/imports/utils/throttle';
import { layoutDispatch, layoutSelect } from '/imports/ui/components/layout/context';
import DEFAULT_VALUES from '/imports/ui/components/layout/defaultValues';
import { INITIAL_INPUT_STATE } from '/imports/ui/components/layout/initState';
import { ACTIONS, CAMERADOCK_POSITION, PANELS } from '/imports/ui/components/layout/enums';
import { defaultsDeep } from '/imports/utils/array-utils';
import Session from '/imports/ui/services/storage/in-memory';

const windowWidth = () => window.document.documentElement.clientWidth;
const windowHeight = () => window.document.documentElement.clientHeight;

const ParticipantsAndChatOnlyLayout = () => {
const input = layoutSelect(i => i.input);
const deviceType = layoutSelect(i => i.deviceType);
const fullscreen = layoutSelect(i => i.fullscreen);
const layoutContextDispatch = layoutDispatch();

// Hook to get previous value
function usePrevious(value) {
const ref = useRef();
useEffect(() => { ref.current = value; }, [value]);
return ref.current;
}
const prevDeviceType = usePrevious(deviceType);

// Main layout calculation
const calculatesLayout = () => {
const bottomPanelHeight = 300;
const mediaWidth = windowWidth();
const mediaHeight = windowHeight() - bottomPanelHeight;

```
// Hide left sidebar completely
layoutContextDispatch({
  type: ACTIONS.SET_SIDEBAR_NAVIGATION_OUTPUT,
  value: { display: false, width: 0, minWidth: 0, maxWidth: 0, height: 0, top: 0, left: 0, right: 0, zIndex: 0 }
});

// Set bottom chat panel
layoutContextDispatch({
  type: ACTIONS.SET_SIDEBAR_CONTENT_OUTPUT,
  value: {
    display: true,
    width: mediaWidth,
    minWidth: mediaWidth,
    maxWidth: mediaWidth,
    height: bottomPanelHeight,
    minHeight: bottomPanelHeight,
    maxHeight: bottomPanelHeight,
    top: mediaHeight,
    left: 0,
    right: 0,
    currentPanelType: PANELS.CHAT,
    isResizable: false,
    tabOrder: DEFAULT_VALUES.sidebarContentTabOrder,
    zIndex: 999,
  }
});

// Media area above bottom panel
layoutContextDispatch({
  type: ACTIONS.SET_MEDIA_AREA_SIZE,
  value: { width: mediaWidth, height: mediaHeight }
});
```

};

const throttledCalculatesLayout = throttle(calculatesLayout, 50, { trailing: true, leading: true });

// Initialize layout
const init = () => {
layoutContextDispatch({
type: ACTIONS.SET_LAYOUT_INPUT,
value: prevInput => defaultsDeep({
sidebarNavigation: { isOpen: false }, // force left sidebar hidden
sidebarContent: { isOpen: true, sidebarContentPanel: PANELS.CHAT },
presentation: { isOpen: false, width: 0, height: 0 },
cameraDock: { position: CAMERADOCK_POSITION.SIDEBAR_CONTENT_BOTTOM, numCameras: prevInput.cameraDock.numCameras },
}, INITIAL_INPUT_STATE)
});
Session.setItem('layoutReady', true);
throttledCalculatesLayout();
};

// Run layout calculations on device change, input change or fullscreen change
useEffect(() => {
if (deviceType === null) return;
if (deviceType !== prevDeviceType) { init(); }
else { throttledCalculatesLayout(); }
}, [input, deviceType, fullscreen]);

// Recalculate on window resize
useEffect(() => {
window.addEventListener('resize', throttledCalculatesLayout);
return () => window.removeEventListener('resize', throttledCalculatesLayout);
}, []);

return null;
};

export default ParticipantsAndChatOnlyLayout;

