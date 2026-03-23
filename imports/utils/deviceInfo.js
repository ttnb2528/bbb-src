import Bowser from "bowser";

export const { userAgent } = window.navigator;
export const BOWSER_RESULTS = Bowser.parse(userAgent);

const isPhone = BOWSER_RESULTS.platform.type === "mobile";
// we need a 'hack' to correctly detect ipads with ios > 13
export const isTablet =
  BOWSER_RESULTS.platform.type === "tablet" ||
  (BOWSER_RESULTS.os.name === "macOS" && window.navigator.maxTouchPoints > 0);
export const isMobile = isPhone || isTablet;
export const hasMediaDevices = !!navigator.mediaDevices;
export const osName = BOWSER_RESULTS.os.name;
export const osVersion = BOWSER_RESULTS.os.version;
export const isIos = osName === "iOS" || (isTablet && osName === "macOS");
export const isMacos = osName === "macOS";
export const isIphone = !!userAgent.match(/iPhone/i);

export const isPortrait = () => window.innerHeight > window.innerWidth;

const deviceInfo = {
  get isTablet() {
    // Phân giải tự động hỗ trợ Resize màn hình nhỏ (Tablet breakpoint < 1200px theo chuẩn chung BBB)
    return isTablet || (window.innerWidth >= 600 && window.innerWidth < 1200);
  },
  get isPhone() {
    // Phân giải hỗ trợ Mobile breakpoint (< 600px)
    return isPhone || window.innerWidth < 600;
  },
  get isMobile() {
    return this.isPhone || this.isTablet;
  },
  hasMediaDevices,
  osName,
  osVersion,
  isPortrait,
  isIos,
  isMacos,
  isIphone,
};

export default deviceInfo;
