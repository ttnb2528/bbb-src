import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { useIntl } from "react-intl";
import Styled from "../app/styles";
import WebcamContainer from "../webcam/component";
import AudioContainer from "../audio/container";
import ChatAlertContainerGraphql from "../chat/chat-graphql/alert/component";
import EcommerceChat from "./ecommerce-chat";
import ActionsBarContainer from "../actions-bar/container";
import NotificationsBarContainer from "../notifications-bar/container";
import ToastContainer from "/imports/ui/components/common/toast/container";

// Import các components cơ bản của BBB
import ActivityCheckContainer from "/imports/ui/components/activity-check/container";
import ScreenReaderAlertContainer from "../screenreader-alert/container";
import BannerBarContainer from "/imports/ui/components/banner-bar/container";
import ExternalVideoPlayerContainer from "../external-video-player/external-video-player-graphql/component";
import Notifications from "../notifications/component";

import AudioControlsContainer from "../audio/audio-graphql/audio-controls/component";
import JoinVideoOptionsContainer from "../video-provider/video-button/container";
import Auth from "/imports/ui/services/auth";
import Session from "/imports/ui/services/storage/in-memory";
import useMeeting from "/imports/ui/core/hooks/useMeeting";
import useCurrentUser from "/imports/ui/core/hooks/useCurrentUser";
import { USER_LEAVE_MEETING } from "/imports/ui/core/graphql/mutations/userMutations";
import { MEETING_END } from "/imports/ui/components/end-meeting-confirmation/mutations";

import { USER_AGGREGATE_COUNT_SUBSCRIPTION } from "/imports/ui/core/graphql/queries/users";
import useDeduplicatedSubscription from "/imports/ui/core/hooks/useDeduplicatedSubscription";
import { useLoadedUserList } from "/imports/ui/core/hooks/useLoadedUserList";

// Component dành riêng cho giao diện Bán hàng
const shouldUseMobileShell = () => {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent || "";
  const narrowViewport = window.innerWidth < 700;
  const isTouchTabletOrPhone =
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(
      userAgent,
    ) ||
    (window.navigator.platform === "MacIntel" &&
      window.navigator.maxTouchPoints > 1);

  return narrowViewport || (isTouchTabletOrPhone && window.innerWidth < 768);
};

const EcommerceLayout = (props) => {
  const {
    isAudioModalOpen,
    setAudioModalIsOpen,
    isVideoPreviewModalOpen,
    setVideoPreviewModalIsOpen,
    hideActionsBar,
    presentationIsOpen,
    setPresentationFitToWidth,
    hideNotificationToasts,
    isNotificationEnabled,
  } = props;

  const intl = useIntl();
  const locale = intl.locale || "en";
  const isVietnamese = locale.toLowerCase().startsWith("vi");

  // Hàm helper dịch ngôn ngữ nhanh
  const t = (viText, enText) => (isVietnamese ? viText : enText);

  const [showProductPanel, setShowProductPanel] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [shopInfo, setShopInfo] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true); // Mặc định true để không chớp giật lúc load
  const [hasCameraEverStarted, setHasCameraEverStarted] = useState(false); // Theo dõi xem live đã từng bật chưa
  const [isRealDesktop, setIsRealDesktop] = useState(
    typeof window !== "undefined" ? !shouldUseMobileShell() : true,
  );
  const [showMobileHostSettings, setShowMobileHostSettings] = useState(false);
  const isDeviceModalOpen = isAudioModalOpen || isVideoPreviewModalOpen;

  // Chỉ dùng shell dọc kiểu mobile trên màn hình nhỏ.
  // Desktop phải render full stage để không bóp méo layout webcam của BBB.
  const isMobile = !isRealDesktop;

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsRealDesktop(!shouldUseMobileShell());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.classList.add("ovbay-ecommerce-live-active");

    return () => {
      document.body.classList.remove("ovbay-ecommerce-live-active");
      document.body.classList.remove("ovbay-ecommerce-device-modal-open");
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle(
      "ovbay-ecommerce-device-modal-open",
      isDeviceModalOpen,
    );
  }, [isDeviceModalOpen]);

  // Chặn tự động xoay màn hình trên thiết bị di động
  useEffect(() => {
    if (isRealDesktop) return;
    if (
      typeof screen !== "undefined" &&
      screen.orientation &&
      screen.orientation.lock
    ) {
      screen.orientation.lock("portrait").catch((error) => {
        console.warn(
          "Khóa xoay màn hình không được hỗ trợ hoặc bị từ chối:",
          error,
        );
      });
    }
  }, [isRealDesktop]);

  // Dùng useEffect và Interval để "soi" xem thẻ video có thực sự đang chạy (live) hay không
  useEffect(() => {
    const checkCamera = () => {
      const videos = document.querySelectorAll(
        ".ecommerce-video-wrapper video, video",
      );
      let isLive = false;
      videos.forEach((v) => {
        if (v.readyState !== 0 && !v.paused) {
          isLive = true;
          setHasCameraEverStarted(true); // Ghi nhận phiên live đã chính thức chạy
          // KÍCH HOẠT AUTO PiP GIỐNG GOOGLE MEET
          // Khi người dùng chuyển tab, video sẽ TỰ ĐỘNG thu nhỏ mà không cần code JS can thiệp
          if ("autoPictureInPicture" in v) {
            v.autoPictureInPicture = true;
          }
        }
      });
      setIsCameraActive(isLive);
    };

    const intervalId = setInterval(checkCamera, 1000);
    setTimeout(checkCamera, 500); // Check nhanh lần đầu sau khi render
    return () => clearInterval(intervalId);
  }, []);

  // State quản lý sản phẩm lấy từ API thật
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [hasFetchedProducts, setHasFetchedProducts] = useState(false);
  const [apiBase, setApiBase] = useState("http://localhost:8000");
  const [currentMeetingId, setCurrentMeetingId] = useState("");

  const [pinnedProduct, setPinnedProduct] = useState(null);

  // Trạng thái quản lý thông báo người dùng vào phòng
  const [joinNotifications, setJoinNotifications] = useState([]);
  const prevUsersRef = useRef([]);

  // --- NEW FEATURES STATE ---
  const [isFollowing, setIsFollowing] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState([]);
  const [fomoNotifications, setFomoNotifications] = useState([]);
  const [userLeaveMeeting] = useMutation(USER_LEAVE_MEETING);
  const [meetingEnd] = useMutation(MEETING_END);

  // Handlers cho các action
  const handleLike = () => {
    setLikeCount((prev) => prev + 1);
    const newHeart = {
      id: Date.now(),
      left: Math.random() * 40 + 10, // Vị trí ngẫu nhiên
      color: ["#ff3b30", "#ff2a00", "#FF6B35", "#ffb300"][
        Math.floor(Math.random() * 4)
      ], // Màu ngẫu nhiên
    };
    setFloatingHearts((prev) => [...prev, newHeart]);

    // Xóa tim sau 3s animation
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 3000);

    if (apiBase && currentMeetingId) {
      fetch(`${apiBase}/api/livestream/${currentMeetingId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.extId }),
      }).catch((e) => console.error(e));
    }
  };

  const isGuest = () => {
    return currentUser?.name?.startsWith("Khách ") || !currentUser?.extId;
  };

  const handleShare = () => {
    if (apiBase && currentMeetingId) {
      const shareUrl = `${apiBase}/live/${currentMeetingId}`;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => alert("Đã sao chép đường dẫn chia sẻ phiên Live!"))
          .catch((e) => {
            prompt("Copy link sau để chia sẻ:", shareUrl);
          });
      } else {
        prompt("Copy link sau để chia sẻ:", shareUrl);
      }
    }
  };

  const handleLoginRedirect = () => {
    let frontendUrl = apiBase;
    if (apiBase && apiBase.includes("api.ovbayvn.com")) {
      frontendUrl = "https://ovbayvn.com";
    } else if (apiBase && apiBase.includes("localhost")) {
      frontendUrl = "http://localhost:3000";
    } else if (apiBase && apiBase.includes("api.")) {
      frontendUrl = apiBase.replace("api.", "");
    }

    window.open(`${frontendUrl}/main/auth/login`, "_blank");
    setShowLoginModal(false);
  };

  const handleFollow = () => {
    if (isGuest()) {
      setShowLoginModal(true);
      return;
    }

    if (!isFollowing) {
      setIsFollowing(true);
      if (shopInfo?.id) {
        localStorage.setItem(`followed_shop_${shopInfo.id}`, "true");
      }
      if (apiBase && currentMeetingId) {
        fetch(`${apiBase}/api/livestream/${currentMeetingId}/follow`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser?.extId }),
        }).catch((e) => console.error(e));
      }
    }
  };

  // Removed FOMO effect as requested

  // Hook lấy role của user hiện tại
  const { data: currentUser } = useCurrentUser((u) => ({
    role: u.role,
    extId: u.extId,
    name: u.name,
  }));
  const isHost = currentUser?.role === "MODERATOR";
  const handleExitLive = async () => {
    try {
      if (isHost) {
        await meetingEnd();
        return;
      }

      await userLeaveMeeting();
      Session.setItem("codeError", "680");
    } catch (error) {
      console.error("Không thể thoát phiên live:", error);
    }
  };

  // Hook lấy thông tin Meeting hiện tại để lấy MeetingID gửi về ovbay
  const { data: currentMeeting } = useMeeting((m) => ({
    meetingId: m.meetingId,
    name: m.name,
    extId: m.extId,
    metadata: m.metadata,
  }));

  // Hook lấy số lượng người tham gia thực tế (Viewer Count)
  const { data: countData } = useDeduplicatedSubscription(
    USER_AGGREGATE_COUNT_SUBSCRIPTION,
  );
  const actualParticipantCount =
    countData?.user_aggregate?.aggregate?.count || 1;

  // Lắng nghe sự kiện người dùng thật vào phòng thông qua danh sách User loaded
  const { data: usersData } = useLoadedUserList(
    { offset: 0, limit: 100 },
    (u) => ({ userId: u.userId, name: u.name }),
  );

  useEffect(() => {
    if (usersData && usersData.length > 0) {
      if (
        prevUsersRef.current.length > 0 &&
        usersData.length > prevUsersRef.current.length
      ) {
        // Tìm ra những người dùng mới (chưa có trong prev list)
        const newUsers = usersData.filter(
          (u) =>
            !prevUsersRef.current.some((prevU) => prevU.userId === u.userId),
        );

        newUsers.forEach((user) => {
          // Bỏ qua nếu chính mình vừa join (Host join)
          if (user.userId === currentUser?.userId) return;

          const newNotif = { id: Date.now() + Math.random(), name: user.name };
          setJoinNotifications((prev) => [...prev, newNotif]);

          // Tự động xóa thông báo sau 6 giây (chậm lại để người xem kịp đọc)
          setTimeout(() => {
            setJoinNotifications((prev) =>
              prev.filter((n) => n.id !== newNotif.id),
            );
          }, 6000);
        });
      }
      prevUsersRef.current = usersData;
    }
  }, [usersData, currentUser?.userId]);

  // Hàm cắt chuỗi ở giữa (ví dụ: "Nguyễn Thị...h Bích")
  const truncateNameMiddle = (name) => {
    if (!name) return "";
    if (name.length <= 15) return name;
    return name.substring(0, 7) + "..." + name.substring(name.length - 5);
  };

  // Hook gọi API ngay khi vào trang để pre-fetch dữ liệu
  useEffect(() => {
    if (!hasFetchedProducts && currentMeeting?.meetingId) {
      const fetchProducts = async () => {
        setIsLoadingProducts(true);
        setHasFetchedProducts(true); // Đánh dấu đã fetch để không lặp lại
        try {
          // BBB lưu External Meeting ID trong extId hoặc meta_meetingId
          let parsedApiUrl = "http://localhost:8000";
          let parsedRoomId = null;
          try {
            if (Auth.logoutURL) {
              const urlObj = new URL(Auth.logoutURL);
              parsedApiUrl = urlObj.origin;
              parsedRoomId = urlObj.searchParams.get("room_id");
            }
          } catch (e) {}

          const meetingId =
            parsedRoomId ||
            currentMeeting?.extId ||
            currentMeeting?.metadata?.meta_meetingId ||
            currentMeeting?.metadata?.meetingId ||
            Auth.meetingID;
          if (!meetingId) return;

          // Đọc apiUrl từ metadata hoặc logoutURL fallback
          const baseApiUrl =
            currentMeeting?.metadata?.meta_apiUrl ||
            currentMeeting?.metadata?.apiUrl ||
            parsedApiUrl;

          setApiBase(baseApiUrl);
          setCurrentMeetingId(meetingId);
          const apiUrl = `${baseApiUrl}/api/livestream/${meetingId}/details`;

          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              if (data.data.products) {
                setProducts(data.data.products);
                if (data.data.current_pinned_product_id) {
                  const p = data.data.products.find(
                    (p) => p.id == data.data.current_pinned_product_id,
                  );
                  if (p) setPinnedProduct(p);
                }
              }
              // Set số lượt thích hiện tại và kiểm tra follow
              if (data.data.likes_count !== undefined) {
                setLikeCount(data.data.likes_count);
              }
              if (localStorage.getItem(`followed_shop_${meetingId}`)) {
                setIsFollowing(true);
              }
            }
          }
        } catch (e) {
          console.error("Lỗi tải sản phẩm từ OVBAY:", e);
        } finally {
          setIsLoadingProducts(false);
        }
      };

      fetchProducts();
    }
  }, [showProductPanel, hasFetchedProducts, currentMeeting]);

  // Hook Polling để tự động lấy sản phẩm đang được ghim (Dành cho cả Host và Viewer)
  useEffect(() => {
    if (!currentMeetingId) return;

    const pollPinnedProduct = async () => {
      try {
        const apiUrl = `${apiBase}/api/livestream/${currentMeetingId}/details`;
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const currentPinnedId = data.data.current_pinned_product_id;

            // Lưu thông tin shop để hiển thị avatar + tên
            if (data.data.shop) {
              setShopInfo(data.data.shop);
            }

            // Cập nhật số lượt thích
            if (
              data.data.likes_count !== undefined &&
              data.data.likes_count > likeCount
            ) {
              setLikeCount(data.data.likes_count);
            }

            // Cập nhật lại list product nếu đang mở giỏ hàng
            if (data.data.products && products.length === 0) {
              setProducts(data.data.products);
            }

            if (currentPinnedId) {
              const p = (data.data.products || products).find(
                (p) => p.id == currentPinnedId,
              );
              if (p && (!pinnedProduct || pinnedProduct.id != p.id)) {
                setPinnedProduct(p);
              }
            } else {
              setPinnedProduct(null);
            }
          }
        }
      } catch (e) {
        console.error("Lỗi fetch sản phẩm ghim:", e);
      }
    };

    // Gọi lần đầu tiên để lấy trạng thái hiện tại
    pollPinnedProduct();

    // Thay thế Polling bằng Laravel Reverb WebSockets
    if (currentMeeting?.metadata?.reverbKey) {
      const reverbKey = currentMeeting.metadata.reverbKey;
      const reverbHost = currentMeeting.metadata.reverbHost;
      const reverbPort = currentMeeting.metadata.reverbPort;
      const reverbScheme = currentMeeting.metadata.reverbScheme || "http";

      const setupPusher = () => {
        if (!window.Pusher) return;
        const pusher = new window.Pusher(reverbKey, {
          wsHost: reverbHost,
          wsPort: reverbPort,
          wssPort: reverbPort,
          forceTLS: reverbScheme === "https",
          disableStats: true,
          enabledTransports: ["ws", "wss"],
          cluster: "mt1", // Bắt buộc phải có dù không dùng Pusher thật
        });

        const channel = pusher.subscribe(`livestream.${currentMeetingId}`);
        channel.bind("ProductPinned", function (data) {
          console.log("⚡ [WebSocket] ProductPinned Event:", data);
          if (data.product_id) {
            // Cần lấy lại mảng products hiện tại từ state, nhưng do closure nên gọi lại hàm poll
            pollPinnedProduct();
          } else {
            setPinnedProduct(null);
          }
        });
      };

      // Tải động script Pusher
      if (!window.Pusher) {
        const script = document.createElement("script");
        script.src = "https://js.pusher.com/8.2.0/pusher.min.js";
        script.async = true;
        script.onload = setupPusher;
        document.body.appendChild(script);
      } else {
        setupPusher();
      }
    } else {
      // Fallback: Nếu không có metadata Reverb, dùng Polling tạm thời
      const interval = setInterval(pollPinnedProduct, 3000);
      return () => clearInterval(interval);
    }

    // Cleanup Pusher on unmount
    return () => {
      if (
        window.Pusher &&
        window.Pusher.instances &&
        window.Pusher.instances.length > 0
      ) {
        window.Pusher.instances[0].unsubscribe(
          `livestream.${currentMeetingId}`,
        );
      }
    };
  }, [currentMeetingId, apiBase]);

  // Hàm lấy link sản phẩm
  const getProductLink = (product) => {
    const storefrontUrl =
      currentMeeting?.metadata?.meta_storefrontUrl ||
      currentMeeting?.metadata?.storefrontUrl ||
      "https://ovbayvn.com";
    return `${storefrontUrl}/main/products/${product.id}`;
  };

  // Hàm xử lý khi Host bấm "Ghim" sản phẩm
  const handlePinProduct = async (product) => {
    console.log("📌 Đang tiến hành ghim sản phẩm:", product);

    // 1. Tích hợp trực tiếp với Backend OVBAY (Laravel) để phát sự kiện Reverb WebSocket
    try {
      let parsedApiUrl = "http://localhost:8000";
      let parsedRoomId = null;
      try {
        if (Auth.logoutURL) {
          const urlObj = new URL(Auth.logoutURL);
          parsedApiUrl = urlObj.origin;
          parsedRoomId = urlObj.searchParams.get("room_id");
        }
      } catch (e) {}

      const meetingId =
        parsedRoomId ||
        currentMeeting?.extId ||
        currentMeeting?.metadata?.meta_meetingId ||
        currentMeeting?.metadata?.meetingId ||
        Auth.meetingID;

      // Lấy token auth của Host nếu được truyền qua metadata lúc tạo phòng
      // const hostToken = currentMeeting?.metadata?.ovbay_host_token;

      // Lấy URL Backend từ metadata
      const baseApiUrl =
        currentMeeting?.metadata?.meta_apiUrl ||
        currentMeeting?.metadata?.apiUrl ||
        parsedApiUrl;
      const apiUrl = `${baseApiUrl}/api/livestream/pin-product`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // "Authorization": `Bearer ${hostToken}`
        },
        body: JSON.stringify({
          meeting_id: meetingId,
          product_id: product.id,
        }),
      });

      if (res.ok) {
        setPinnedProduct(product);
        console.log("✅ Đã ghim sản phẩm thành công!");
      }
    } catch (e) {
      console.error("❌ Lỗi khi gửi API ghim sản phẩm:", e);
    }
  };

  const handleUnpinProduct = async () => {
    try {
      const apiUrl = `${apiBase}/api/livestream/unpin-product`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          meeting_id: currentMeetingId,
        }),
      });

      if (res.ok) {
        setPinnedProduct(null);
        console.log("✅ Đã bỏ ghim sản phẩm thành công!");
      }
    } catch (e) {
      console.error("❌ Lỗi khi gửi API bỏ ghim sản phẩm:", e);
    }
  };

  return (
    <>
      <Styled.Layout
        id="ecommerce-layout"
        onDoubleClick={isMobile ? handleLike : undefined}
        className={`ecommerce-layout-container ecommerce-mode${
          isDeviceModalOpen ? " ecommerce-device-modal-open" : ""
        }`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          transform: "none",
          width: isMobile ? "100vw" : "100%",
          maxWidth: isMobile ? "430px" : "none",
          height: "100vh",
          background:
            "radial-gradient(circle at top left, rgba(255,107,53,0.22) 0%, rgba(255,107,53,0) 28%), linear-gradient(180deg, #1a1120 0%, #0c0b14 55%, #060606 100%)",
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif",
          zIndex: 9999,
          boxShadow: isMobile ? "0 0 50px rgba(0,0,0,0.8)" : "none",
          margin: isMobile ? "0 auto" : "0",
          right: isMobile ? "auto" : 0,
          touchAction: "manipulation",
        }}
      >
        <ActivityCheckContainer />
        <ScreenReaderAlertContainer />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .ecommerce-mode {
            background:
              radial-gradient(circle at top left, rgba(255,107,53,0.22) 0%, rgba(255,107,53,0) 30%),
              radial-gradient(circle at top right, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0) 26%),
              linear-gradient(180deg, #1a1120 0%, #0c0b14 55%, #060606 100%) !important;
          }
          .ecommerce-layout-container.ecommerce-mode {
            width: 100% !important;
            height: 100vh !important;
          }
          @media (min-width: 769px) {
            .ecommerce-layout-container.ecommerce-mode {
              max-width: none !important;
              left: 0 !important;
              right: 0 !important;
              transform: none !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
          }
          html, body, #app, #content, [class*="layout"] {
            overflow: hidden !important;
            overscroll-behavior: none !important;
            scroll-behavior: auto !important;
          }
          body {
            background:
              radial-gradient(circle at top left, rgba(255,107,53,0.18) 0%, rgba(255,107,53,0) 30%),
              linear-gradient(180deg, #140e1b 0%, #09090f 58%, #050505 100%) !important;
          }

          body.ovbay-ecommerce-live-active .ReactModalPortal {
            position: relative;
            z-index: 20000 !important;
          }

          body.ovbay-ecommerce-live-active .ReactModalPortal .ReactModal__Overlay {
            z-index: 20000 !important;
          }

          body.ovbay-ecommerce-live-active .ReactModalPortal .ReactModal__Content {
            z-index: 20001 !important;
          }

          body.ovbay-ecommerce-live-active .ReactModalPortal [data-test="audioModal"],
          body.ovbay-ecommerce-live-active .ReactModalPortal [data-test="webcamSettingsModal"] {
            z-index: 20001 !important;
          }

          body.ovbay-ecommerce-live-active #modals-container {
            position: relative;
            z-index: 25000 !important;
          }

          body.ovbay-ecommerce-live-active #modals-container .modal-low:has([data-test="webcamSettingsModal"]),
          body.ovbay-ecommerce-live-active #modals-container .modal-medium:has([data-test="webcamSettingsModal"]),
          body.ovbay-ecommerce-live-active #modals-container .modal-high:has([data-test="webcamSettingsModal"]) {
            display: block !important;
            z-index: 25001 !important;
          }

          body.ovbay-ecommerce-live-active #modals-container [data-test="webcamSettingsModal"] {
            z-index: 25002 !important;
            pointer-events: auto !important;
          }

          #app[aria-hidden="true"] #ecommerce-layout {
            pointer-events: none !important;
          }

          #app[aria-hidden="true"] #ecommerce-layout * {
            pointer-events: none !important;
          }

          /* Với livestream OVBay, để BBB tự quản lý stage/layout webcam.
             Chỉ ép phần tử webcam fill đúng stage và giữ tỉ lệ ở giữa. */
          .ecommerce-video-wrapper [data-test="webcamItem"],
          .ecommerce-video-wrapper [data-test="webcamItemTalkingUser"],
          .ecommerce-video-wrapper .videoContainer {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            background:
              radial-gradient(circle at top, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 35%),
              linear-gradient(180deg, rgba(15,36,46,0.95) 0%, rgba(12,15,34,0.98) 100%) !important;
          }

          .ecommerce-video-wrapper [data-test="videoContainer"],
          .ecommerce-video-wrapper [data-test="mirroredVideoContainer"] {
            position: relative !important;
            top: auto !important;
            left: auto !important;
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
            object-position: center center !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background:
              radial-gradient(circle at top, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 35%),
              linear-gradient(180deg, rgba(15,36,46,0.95) 0%, rgba(12,15,34,0.98) 100%) !important;
            pointer-events: none !important;
          }

          .ecommerce-video-wrapper video,
          .ecommerce-video-wrapper [data-test="videoContainer"] video,
          .ecommerce-video-wrapper [data-test="mirroredVideoContainer"] video {
            background: transparent !important;
            object-fit: contain !important;
            object-position: center center !important;
          }

          .ecommerce-video-wrapper::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              linear-gradient(90deg, rgba(10,15,34,0.24) 0%, transparent 12%, transparent 88%, rgba(10,15,34,0.24) 100%),
              linear-gradient(180deg, rgba(10,15,34,0.24) 0%, transparent 14%, transparent 86%, rgba(10,15,34,0.24) 100%);
            box-shadow: inset 0 0 120px rgba(7, 12, 25, 0.18);
            z-index: 2;
          }
          
          /* Ẩn cục tên người dùng và các nút nhỏ xíu trên góc của thẻ Camera mặc định BBB */
          .ecommerce-video-wrapper [class*="videoInfo"],
          .ecommerce-video-wrapper [class*="dropdown"],
          .ecommerce-video-wrapper [data-test="videoListItem"] span,
          .ecommerce-video-wrapper [data-test="videoListItem"] button {
             display: none !important;
             opacity: 0 !important;
             pointer-events: none !important;
          }
          
          /* Ẩn hoàn toàn dải camera nhỏ (VideoStrip) phía trên cùng (dùng global selector vì BBB dùng Portal) */
          [data-test="videoStripWrapper"],
          [data-test="videoStrip"] {
             display: none !important;
             opacity: 0 !important;
             pointer-events: none !important;
          }
          
          /* Giao diện khung Chat Tiktok Live Style */
          .ecommerce-chat-overlay > div {
            background: transparent !important; /* Xoá nền đen mờ chỗ chat */
            backdrop-filter: none !important; /* Xoá blur */
            -webkit-backdrop-filter: none !important;
            border-radius: 16px !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          /* CSS Giao diện Nút bấm Custom (Mic, Cam, Kết thúc) */
          /* Xóa class custom ghi đè lên BBB buttons để tránh hỏng SVG icon */
          .ecommerce-custom-controls {
             display: flex;
             align-items: center;
             gap: 8px;
             padding-bottom: 5px;
          }
          
          /* Nút đỏ khi Rời phiên / Kết thúc */
          .ecommerce-custom-controls [data-test="leaveMeetingButton"],
          .ecommerce-custom-controls [data-test="leaveMeetingButton"] button,
          .ecommerce-custom-controls button[aria-label*="Leave"],
          .ecommerce-custom-controls button[aria-label*="End"] {
             background: rgba(239, 68, 68, 0.8) !important;
             border: 1px solid rgba(239, 68, 68, 0.4) !important;
          }
          .ecommerce-custom-controls button[aria-label*="Leave"]:hover,
          .ecommerce-custom-controls button[aria-label*="End"]:hover {
             background: rgba(220, 38, 38, 0.9) !important;
          }
          
          /* Animation cho Spinner của màn hình chờ */
          @keyframes spin {
             0% { transform: rotate(0deg); }
             100% { transform: rotate(360deg); }
          }
          
          /* Ẩn cục Avatar mặc định của BBB khi chưa có Camera */
          .ecommerce-video-wrapper-inactive > div,
          .ecommerce-video-wrapper [class*="avatar"],
          .ecommerce-video-wrapper [data-test="userAvatar"] {
             opacity: 0 !important;
             pointer-events: none !important;
             display: none !important;
           }
        `,
          }}
        />

        {/* --- TIKTOK STYLE HOST PROFILE BADGE (Top Left) --- */}
        {true && (
          <div
            style={{
              position: "absolute",
              top: isMobile ? "10px" : "20px",
              left: isMobile ? "10px" : "20px",
              display: "flex",
              alignItems: "center",
              background:
                "linear-gradient(135deg, rgba(20,20,20,0.85) 0%, rgba(0,0,0,0.9) 100%)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "40px",
              padding: isMobile ? "4px 16px 4px 8px" : "8px 20px 8px 12px",
              gap: isMobile ? "6px" : "10px",
              zIndex: 100,
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              animation: "slideInDown 0.5s ease-out forwards",
              maxWidth: "calc(100vw - 60px)",
            }}
          >
            <style>
              {`
                @keyframes slideInDown {
                  0% { opacity: 0; transform: translateY(-20px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes blink {
                  0% { opacity: 1; }
                  50% { opacity: 0.4; }
                  100% { opacity: 1; }
                }
              `}
            </style>
            <div
              style={{
                width: isMobile ? "28px" : "38px",
                height: isMobile ? "28px" : "38px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FF6B35, #ff2a00)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: isMobile ? "14px" : "18px",
                boxShadow: "0 2px 8px rgba(255,107,53,0.5)",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              {(() => {
                const hostAvatar =
                  shopInfo?.avatar ||
                  currentMeeting?.metadata?.meta_hostavatar ||
                  currentMeeting?.metadata?.hostavatar ||
                  currentMeeting?.metadata?.meta_hostAvatar ||
                  currentMeeting?.metadata?.hostAvatar;
                const hostName =
                  shopInfo?.name ||
                  currentMeeting?.metadata?.meta_hostname ||
                  currentMeeting?.metadata?.hostname ||
                  currentMeeting?.metadata?.meta_hostName ||
                  currentMeeting?.metadata?.hostName;

                if (hostAvatar) {
                  return (
                    <img
                      src={hostAvatar}
                      alt="Host"
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  );
                }

                if (hostName) {
                  return hostName.charAt(0).toUpperCase();
                }

                return "H";
              })()}
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: "700",
                  fontSize: isMobile ? "11px" : "13px",
                  lineHeight: "1.2",
                  maxWidth: isMobile ? "80px" : "140px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {shopInfo?.name ||
                  currentMeeting?.metadata?.meta_hostname ||
                  currentMeeting?.metadata?.hostname ||
                  currentMeeting?.metadata?.meta_hostName ||
                  currentMeeting?.metadata?.hostName ||
                  "Phiên Live"}
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    color: "#ff3b30",
                    fontWeight: "900",
                    fontSize: "10px",
                    animation: "blink 1s infinite",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#ff3b30",
                      boxShadow: "0 0 4px #ff3b30",
                    }}
                  ></div>
                  LIVE
                </span>
                <span
                  key={likeCount}
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: "bold",
                    animation:
                      likeCount > 0 ? "popHeart 0.3s ease-out" : "none",
                  }}
                >
                  <style>
                    {`
                      @keyframes popHeart {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.4); }
                        100% { transform: scale(1); }
                      }
                    `}
                  </style>
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="#ff2a00"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {likeCount >= 1000000
                    ? (likeCount / 1000000).toFixed(1) + "m"
                    : likeCount >= 1000
                      ? (likeCount / 1000).toFixed(1) + "k"
                      : likeCount}
                </span>
              </div>
            </div>
            {/* Nút Follow */}
            {!isHost && (
              <button
                onClick={handleFollow}
                style={{
                  marginLeft: "2px",
                  background: isFollowing
                    ? "rgba(255,255,255,0.2)"
                    : "linear-gradient(90deg, #ff1e00, #ff5722)",
                  color: "white",
                  border: isFollowing
                    ? "1px solid rgba(255,255,255,0.3)"
                    : "none",
                  borderRadius: "20px",
                  padding: isMobile ? "4px 8px" : "6px 14px",
                  fontSize: isMobile ? "10px" : "11px",
                  fontWeight: "bold",
                  cursor: isFollowing ? "default" : "pointer",
                  boxShadow: isFollowing
                    ? "none"
                    : "0 2px 5px rgba(255,30,0,0.4)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isFollowing)
                    e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  if (!isFollowing)
                    e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {isFollowing
                  ? "Đã theo dõi"
                  : isMobile
                    ? "Follow"
                    : "+ Theo dõi"}
              </button>
            )}
          </div>
        )}

        {/* Video Fullscreen */}
        <div
          className={
            "ecommerce-video-wrapper " +
            (!isCameraActive ? "ecommerce-video-wrapper-inactive" : "")
          }
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            overflow: "hidden",
            background:
              "radial-gradient(circle at top left, rgba(255,107,53,0.18) 0%, rgba(255,107,53,0) 22%), radial-gradient(circle at top right, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0) 24%), linear-gradient(180deg, rgba(13,36,48,0.96) 0%, rgba(10,15,34,0.98) 100%)",
          }}
        >
          {isMobile && (
            <style>
              {`
                .ecommerce-video-wrapper [data-test="videoContainer"],
                .ecommerce-video-wrapper [data-test="mirroredVideoContainer"] {
                  object-fit: contain !important;
                  object-position: center center !important;
                  width: 100% !important;
                  height: 100% !important;
                }
              `}
            </style>
          )}
          <WebcamContainer />
        </div>

        {/* Fallback UI cảnh báo khi chưa bật Camera (Kiểm soát bằng JS React State) */}
        {!isCameraActive && (
          <div
            className="ecommerce-fallback-ui"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 5,
              pointerEvents: "none",
              color: "white",
              textAlign: "center",
              padding: "20px",
              background: isHost
                ? "radial-gradient(circle at top left, rgba(255,107,53,0.18) 0%, rgba(255,107,53,0) 22%), radial-gradient(circle at top right, rgba(56,189,248,0.16) 0%, rgba(56,189,248,0) 24%), linear-gradient(180deg, rgba(13,36,48,0.96) 0%, rgba(10,15,34,0.98) 100%)"
                : "url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat",
            }}
          >
            {/* Nếu là Viewer, thêm một lớp phủ đen mờ lên trên ảnh background */}
            {!isHost && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(12px)",
                  zIndex: -1,
                }}
              ></div>
            )}

            {isHost ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "500",
                    color: "rgba(255,255,255,0.95)",
                    letterSpacing: "0.5px",
                    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {t("Camera đang tắt", "Camera is off")}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.6)",
                    maxWidth: "80%",
                    lineHeight: "1.4",
                    textAlign: "center",
                  }}
                >
                  {t(
                    "Bật camera để bắt đầu phiên Live",
                    "Turn on your camera to start the Live session",
                  )}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                {/* Vòng lặp Spinner Animation */}
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    border: "3px solid rgba(255, 255, 255, 0.15)",
                    borderTop: "3px solid #FF6B35",
                    borderRadius: "50%",
                    animation:
                      "spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
                  }}
                ></div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "500",
                    color: "rgba(255,255,255,0.95)",
                    letterSpacing: "0.5px",
                    marginTop: "10px",
                    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {hasCameraEverStarted
                    ? t(
                        "Phiên Live đang tạm gián đoạn. Vui lòng chờ trong giây lát...",
                        "Livestream is temporarily paused. Please wait a moment...",
                      )
                    : t(
                        "Phiên Live chuẩn bị diễn ra. Vui lòng chờ Host...",
                        "Livestream is about to start. Please wait for the Host...",
                      )}
                </h3>
              </div>
            )}
          </div>
        )}

        {/* --- OVERLAY SẢN PHẨM ĐANG GHIM --- */}
        {pinnedProduct && (
          <div
            style={{
              position: "absolute",
              bottom: isMobile ? "70px" : "auto",
              top: isMobile ? "auto" : "80px",
              left: "10px",
              background: isMobile
                ? "rgba(255, 255, 255, 0.95)"
                : "linear-gradient(145deg, rgba(30,30,30,0.95) 0%, rgba(15,15,15,0.98) 100%)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              padding: isMobile ? "8px" : "10px",
              borderRadius: isMobile ? "8px" : "16px",
              boxShadow: isMobile
                ? "0 4px 12px rgba(0,0,0,0.15)"
                : "0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(255, 107, 53, 0.15)",
              display: "flex",
              gap: isMobile ? "8px" : "12px",
              alignItems: "center",
              zIndex: 100,
              width: isMobile ? "calc(100vw - 80px)" : "300px",
              maxWidth: "300px",
              border: isMobile ? "none" : "1px solid rgba(255, 107, 53, 0.3)",
              animation:
                "slideInLeft 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
              color: isMobile ? "#000" : "#fff",
            }}
          >
            <style>
              {`
                @keyframes slideInLeft {
                  0% { opacity: 0; transform: translateX(-50px) scale(0.9); }
                  100% { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes pulseBadge {
                  0% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.05); opacity: 0.8; }
                  100% { transform: scale(1); opacity: 1; }
                }
              `}
            </style>

            <div style={{ position: "relative" }}>
              <img
                src={
                  pinnedProduct.image_urls?.[0] ||
                  "https://via.placeholder.com/60"
                }
                style={{
                  width: isMobile ? "48px" : "70px",
                  height: isMobile ? "48px" : "70px",
                  objectFit: "cover",
                  borderRadius: isMobile ? "6px" : "12px",
                  boxShadow: isMobile ? "none" : "0 4px 10px rgba(0,0,0,0.3)",
                }}
                alt=""
              />
              <div
                style={{
                  position: "absolute",
                  top: isMobile ? "-6px" : "-10px",
                  left: isMobile ? "-6px" : "-10px",
                  background:
                    "linear-gradient(135deg, #FF1E00 0%, #FF5722 100%)",
                  color: "white",
                  fontSize: isMobile ? "9px" : "11px",
                  fontWeight: "900",
                  padding: isMobile ? "2px 6px" : "4px 8px",
                  borderRadius: isMobile ? "8px" : "12px",
                  animation: "pulseBadge 2s infinite",
                  border: isMobile ? "1px solid #fff" : "2px solid #1A1A1A",
                  boxShadow: "0 4px 10px rgba(255, 30, 0, 0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                ĐANG GHIM
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: isMobile ? "12px" : "13px",
                  color: isMobile ? "#333" : "#ffffff",
                  marginBottom: "2px",
                  lineHeight: "1.3",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {pinnedProduct.name}
              </div>
              <div
                style={{
                  color: "#FF1E00",
                  fontWeight: "bold",
                  fontSize: isMobile ? "13px" : "14px",
                  marginBottom: isMobile ? "0" : "6px",
                }}
              >
                {Number(pinnedProduct.selling_price).toLocaleString("vi-VN")}đ
              </div>

              {/* Nút tác vụ PC */}
              {!isMobile &&
                (isHost ? (
                  <button
                    onClick={handleUnpinProduct}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.15)",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 0",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "700",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.25)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.15)")
                    }
                  >
                    Bỏ Ghim
                  </button>
                ) : (
                  <a
                    href={getProductLink(pinnedProduct)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      textAlign: "center",
                      textDecoration: "none",
                      boxSizing: "border-box",
                      width: "100%",
                      background:
                        "linear-gradient(135deg, #FF6B35 0%, #ff2a00 100%)",
                      color: "white",
                      border: "none",
                      padding: "6px 0",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "700",
                      boxShadow: "0 4px 12px rgba(255,107,53,0.3)",
                      transition: "transform 0.2s",
                    }}
                  >
                    MUA NGAY
                  </a>
                ))}
            </div>

            {/* Nút tác vụ Mobile (Nằm ngang) */}
            {isMobile &&
              (isHost ? (
                <button
                  onClick={handleUnpinProduct}
                  style={{
                    background: "#f1f5f9",
                    color: "#64748b",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  Bỏ ghim
                </button>
              ) : (
                <a
                  href={getProductLink(pinnedProduct)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textDecoration: "none",
                    background: "#ff1e00",
                    color: "white",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    flexShrink: 0,
                    boxShadow: "0 2px 5px rgba(255,30,0,0.3)",
                  }}
                >
                  Mua
                </a>
              ))}
          </div>
        )}

        {/* Khung Chat dành riêng cho Live Commerce */}
        <EcommerceChat isMobile={isMobile} isHost={isHost} />

        {/* Widget Sản phẩm sẽ được thêm vào đây sau */}
        <div id="ecommerce-product-widget-slot"></div>

        {/* Các module media/âm thanh ẩn */}
        <AudioContainer
          {...{
            isAudioModalOpen,
            setAudioModalIsOpen,
            isVideoPreviewModalOpen,
            setVideoPreviewModalIsOpen,
          }}
        />

        {!hideNotificationToasts && isNotificationEnabled && (
          <ToastContainer rtl />
        )}
        <ChatAlertContainerGraphql />

        {/* Nút Giỏ Hàng (Mở ds sản phẩm) */}
        <button
          onClick={() => setShowProductPanel(!showProductPanel)}
          style={{
            position: "absolute",
            bottom: isMobile ? "10px" : "20px",
            left: isMobile ? "10px" : "20px",
            background: "linear-gradient(135deg, #FF6B35 0%, #ff2a00 100%)",
            color: "#fff",
            border: "none",
            borderRadius: isMobile ? "50%" : "30px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            boxShadow: "0 4px 15px rgba(255, 107, 53, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            zIndex: 30,
            transition: "transform 0.2s ease",
            width: isMobile ? "44px" : "auto",
            height: isMobile ? "44px" : "auto",
            padding: isMobile ? "0" : "12px 24px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg
            width={isMobile ? "20" : "24"}
            height={isMobile ? "20" : "24"}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          {!isMobile && "Giỏ Hàng"}
        </button>

        {/* Thanh công cụ Custom (Mic, Cam, Kết thúc Live) thay thế ActionsBar trên PC */}
        {!isMobile && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              zIndex: 110,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderRadius: "999px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: "bold",
              background: "rgba(0,0,0,0.38)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            {Math.max(0, actualParticipantCount - 1)}
            <button
              onClick={handleShare}
              aria-label="Chia sẻ live"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.1s",
                marginLeft: "4px",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.92)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="#ffffff"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))" }}
              >
                <path d="M24 10.518l-12.87-9.518v5.865c-6.837.585-11.13 6.643-11.13 14.618 3.528-5.32 8.16-5.83 11.13-5.597v6.095l12.87-11.463z" />
              </svg>
            </button>
          </div>
        )}

        {!isMobile && (
          <div
            className="ecommerce-custom-controls"
            style={{
              position: "absolute",
              bottom: "24px",
              right: "20px",
              display: "flex",
              gap: "12px",
              zIndex: 120,
              alignItems: "center",
            }}
          >
            <button
              onClick={handleShare}
              aria-label="Chia sẻ live"
              style={{
                display: "none",
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.1s",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.9)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="#ffffff"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
              >
                <path d="M24 10.518l-12.87-9.518v5.865c-6.837.585-11.13 6.643-11.13 14.618 3.528-5.32 8.16-5.83 11.13-5.597v6.095l12.87-11.463z" />
              </svg>
            </button>
            {!isHost && (
              <button
                type="button"
                onClick={handleLike}
                aria-label="Thả tim"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.5)",
                  color: "#ff5a4f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  cursor: "pointer",
                  boxShadow: "0 8px 18px rgba(0,0,0,0.15)",
                }}
              >
                ♥
              </button>
            )}
            {isHost && (
              <>
                <AudioControlsContainer />
                <JoinVideoOptionsContainer />
              </>
            )}
            <button
              type="button"
              onClick={handleExitLive}
              aria-label={isHost ? "Kết thúc live" : "Rời live"}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "1px solid rgba(239,68,68,0.45)",
                background: "rgba(239, 68, 68, 0.88)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                cursor: "pointer",
                boxShadow: "0 10px 28px rgba(239,68,68,0.28)",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {!isMobile && !isHost && (
          <button
            type="button"
            onClick={handleLike}
            aria-label="Thả tim"
            style={{
              position: "absolute",
              right: "20px",
              bottom: "96px",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.5)",
              color: "#ff5a4f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              cursor: "pointer",
              zIndex: 120,
              boxShadow: "0 8px 18px rgba(0,0,0,0.15)",
            }}
          >
            ♥
          </button>
        )}

        {/* Nút Leave cho Mobile (X ở góc trên phải) kèm Mắt Xem */}
        {isMobile && (
          <div
            className="ecommerce-top-right-actions"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
                borderRadius: "16px",
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              {Math.max(0, actualParticipantCount - 1)}
            </div>

            <div className="ecommerce-leave-mobile-wrapper">
              <style>
                {`
                  .ecommerce-leave-mobile-wrapper button {
                    background: rgba(0,0,0,0.5) !important;
                    border: 1px solid rgba(255,255,255,0.14) !important;
                    box-shadow: none !important;
                    color: white !important;
                    width: 32px !important;
                    height: 32px !important;
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                  }
                  .ecommerce-leave-mobile-wrapper button:hover {
                    background: rgba(255,255,255,0.12) !important;
                  }
                  .ecommerce-leave-mobile-wrapper button::after {
                    display: none !important;
                  }
                  .ecommerce-leave-mobile-wrapper button i,
                  .ecommerce-leave-mobile-wrapper button svg,
                  .ecommerce-leave-mobile-wrapper button span {
                    display: none !important;
                  }
                  .ecommerce-leave-mobile-wrapper button::after {
                    content: "✕";
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white !important;
                    font-size: 16px !important;
                    font-weight: bold;
                  }
                `}
              </style>
              <button
                type="button"
                onClick={handleExitLive}
                aria-label={isHost ? "Kết thúc live" : "Rời live"}
                style={{
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Action Sheet (Settings) cho Host Mobile */}
        {isMobile && isHost && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              background: "rgba(28, 28, 30, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "20px 20px 40px 20px",
              zIndex: 9999,
              transition:
                "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s, visibility 0.3s",
              transform: showMobileHostSettings
                ? "translateY(0) scale(1)"
                : "translateY(20px) scale(0.95)",
              opacity: showMobileHostSettings ? 1 : 0,
              visibility: showMobileHostSettings ? "visible" : "hidden",
              pointerEvents: showMobileHostSettings ? "auto" : "none",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: "0 -5px 20px rgba(0,0,0,0.5)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                textAlign: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              Cài đặt Live
            </div>

            <div
              onClickCapture={(e) => {
                if (document.activeElement) {
                  document.activeElement.blur();
                }
                setTimeout(() => setShowMobileHostSettings(false), 200);
              }}
              style={{
                display: "flex",
                justifyContent: "space-around",
                padding: "10px 0",
              }}
            >
              <AudioControlsContainer />
              <JoinVideoOptionsContainer />
            </div>

            <button
              onClick={() => setShowMobileHostSettings(false)}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "white",
                border: "none",
                padding: "16px",
                borderRadius: "14px",
                fontWeight: "bold",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Đóng
            </button>
          </div>
        )}

        {/* KHU VỰC TRÁI DƯỚI (Danh sách thông báo + Giỏ hàng popup) */}
        <div
          style={{
            position: "absolute",
            bottom: isMobile ? "70px" : "80px",
            left: isMobile ? "10px" : "20px",
            display: "flex",
            flexDirection: "column-reverse",
            gap: "10px",
            zIndex: 9990, // Tăng z-index cực cao để đè lên nút Share/Settings
            pointerEvents: "none",
            alignItems: "flex-start",
          }}
        >
          {/* 1. Cửa hàng Popup (Sẽ nằm DƯỚI do column-reverse) */}
          {showProductPanel && (
            <div
              style={{
                width: isMobile ? "calc(100vw - 20px)" : "340px",
                maxWidth: "400px",
                backgroundColor: "rgba(18, 18, 20, 0.9)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderRadius: "24px",
                boxShadow: "0 15px 50px rgba(0,0,0,0.6)",
                padding: isMobile ? "12px" : "20px",
                maxHeight: "400px",
                display: "flex",
                flexDirection: "column",
                animation:
                  "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                border: "1px solid rgba(255,255,255,0.15)",
                pointerEvents: "auto",
              }}
            >
              <style>
                {`
                  @keyframes slideUp {
                    0% { opacity: 0; transform: translateY(30px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                  }
                  .ecommerce-custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                  }
                  .ecommerce-custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .ecommerce-custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                  }
                  .ecommerce-custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.4);
                  }
                `}
              </style>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  paddingBottom: "12px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontSize: isMobile ? "14px" : "16px",
                    fontWeight: "700",
                    letterSpacing: "0.5px",
                  }}
                >
                  Cửa hàng
                </h3>
                <button
                  onClick={() => setShowProductPanel(false)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: "50%",
                    width: isMobile ? "24px" : "28px",
                    height: isMobile ? "24px" : "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#ffffff",
                    fontWeight: "bold",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                  }
                >
                  ✕
                </button>
              </div>

              <div
                className="ecommerce-custom-scrollbar"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  paddingRight: "4px",
                }}
              >
                {isLoadingProducts ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "30px 0",
                      color: "#94a3b8",
                      fontWeight: "bold",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                        marginBottom: "10px",
                        animation: "spin 1s linear infinite",
                      }}
                    >
                      ⏳
                    </div>
                    Đang tải sản phẩm...
                  </div>
                ) : products.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "30px 0",
                      color: "#94a3b8",
                      fontWeight: "bold",
                    }}
                  >
                    <div style={{ fontSize: "30px", marginBottom: "10px" }}>
                      📭
                    </div>
                    Chưa có sản phẩm nào
                  </div>
                ) : (
                  products.map((p) => {
                    const isPinned = pinnedProduct?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "flex",
                          gap: "12px",
                          padding: "10px",
                          background: isPinned
                            ? "linear-gradient(90deg, rgba(255, 107, 53, 0.25) 0%, rgba(255, 107, 53, 0.1) 100%)"
                            : "rgba(255,255,255,0.05)",
                          borderRadius: "16px",
                          border: isPinned
                            ? "1px solid rgba(255, 107, 53, 0.5)"
                            : "1px solid rgba(255,255,255,0.05)",
                          alignItems: "center",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isPinned
                            ? "linear-gradient(90deg, rgba(255, 107, 53, 0.3) 0%, rgba(255, 107, 53, 0.15) 100%)"
                            : "rgba(255,255,255,0.08)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isPinned
                            ? "linear-gradient(90deg, rgba(255, 107, 53, 0.25) 0%, rgba(255, 107, 53, 0.1) 100%)"
                            : "rgba(255,255,255,0.05)";
                        }}
                      >
                        <img
                          src={
                            p.image_urls?.[0] ||
                            "https://via.placeholder.com/60"
                          }
                          style={{
                            width: "65px",
                            height: "65px",
                            objectFit: "cover",
                            borderRadius: "10px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          }}
                          alt=""
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: "600",
                              fontSize: "13px",
                              color: "#ffffff",
                              marginBottom: "4px",
                              lineHeight: "1.3",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {p.name}
                          </div>
                          <div
                            style={{
                              color: "#FF6B35",
                              fontWeight: "bold",
                              fontSize: "14px",
                            }}
                          >
                            {Number(p.selling_price).toLocaleString("vi-VN")}đ
                          </div>
                        </div>
                        {isHost ? (
                          <button
                            onClick={() => handlePinProduct(p)}
                            disabled={isPinned}
                            style={{
                              background: isPinned
                                ? "rgba(255, 107, 53, 0.25)"
                                : "linear-gradient(135deg, #FF6B35 0%, #ff2a00 100%)",
                              color: isPinned ? "#ffffff" : "white",
                              border: isPinned
                                ? "1px solid rgba(255, 107, 53, 0.8)"
                                : "none",
                              padding: "8px 14px",
                              borderRadius: "20px",
                              cursor: isPinned ? "default" : "pointer",
                              fontSize: "12px",
                              fontWeight: "900",
                              boxShadow: isPinned
                                ? "0 0 10px rgba(255, 107, 53, 0.4)"
                                : "0 4px 10px rgba(255,107,53,0.3)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isPinned ? "Đã ghim" : "Ghim"}
                          </button>
                        ) : (
                          <a
                            href={getProductLink(p)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background:
                                "linear-gradient(90deg, #ff6b35 0%, #ff8e53 100%)",
                              color: "white",
                              textDecoration: "none",
                              padding: "6px 12px",
                              borderRadius: "16px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Mua ngay
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 2. Danh sách thông báo (Sẽ tự động nằm TRÊN Cửa hàng popup do column-reverse) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              pointerEvents: "none",
              transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            {joinNotifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(6px)",
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  maxWidth: "220px",
                  animation: "slideInLeft 0.3s ease-out forwards",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                }}
              >
                <style>
                  {`
                    @keyframes slideInLeft {
                      0% { opacity: 0; transform: translateX(-20px); }
                      100% { opacity: 1; transform: translateX(0); }
                    }
                  `}
                </style>
                <span
                  style={{
                    color: "#ffc107",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    display: "inline-block",
                  }}
                >
                  {truncateNameMiddle(notif.name)}
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("vừa vào live", "joined")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Thanh công cụ dọc (Like, Share, Settings) */}
        {isMobile && (
          <div
            style={{
              position: "absolute",
              right: "10px",
              bottom: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              zIndex: 100,
              alignItems: "center",
            }}
          >
          {/* Nút Cài đặt (Mic/Cam) cho Host Mobile */}
          {isMobile && isHost && (
            <button
              onClick={() => setShowMobileHostSettings(true)}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ⚙️
            </button>
          )}

          {!isHost && (
            <button
              type="button"
              onClick={handleLike}
              aria-label="Thả tim"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#ff5a4f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 100,
                fontSize: "22px",
                cursor: "pointer",
              }}
            >
              ♥
            </button>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <button
              onClick={handleShare}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.1s",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.9)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="#ffffff"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
              >
                <path d="M24 10.518l-12.87-9.518v5.865c-6.837.585-11.13 6.643-11.13 14.618 3.528-5.32 8.16-5.83 11.13-5.597v6.095l12.87-11.463z" />
              </svg>
            </button>
          </div>
          </div>
        )}
        {/* 5. Hiệu ứng bong bóng thả tim */}
        <div
          style={{
            position: "absolute",
            right: isMobile ? "10px" : "20px",
            bottom: isMobile ? "220px" : "180px",
            width: "60px",
            height: "300px",
            pointerEvents: "none",
            zIndex: 90,
            overflow: "visible",
          }}
        >
          <style>
            {`
              @keyframes floatUpAndFade {
                0% { transform: translateY(0) scale(0.5); opacity: 1; }
                50% { transform: translateY(-100px) scale(1.2) translateX(-10px); opacity: 0.8; }
                100% { transform: translateY(-200px) scale(1) translateX(10px); opacity: 0; }
              }
            `}
          </style>
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              style={{
                position: "absolute",
                bottom: 0,
                left: `${heart.left}%`,
                color: heart.color,
                fontSize: "24px",
                animation: "floatUpAndFade 2.5s ease-out forwards",
                textShadow: "0 2px 5px rgba(0,0,0,0.3)",
              }}
            >
              ❤️
            </div>
          ))}
        </div>

        {/* --- MODAL YÊU CẦU ĐĂNG NHẬP (Dành cho Guest) --- */}
        {showLoginModal && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <style>
              {`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
              `}
            </style>
            <div
              style={{
                background: "linear-gradient(145deg, #1e1e1e 0%, #121212 100%)",
                border: "1px solid rgba(255,107,53,0.3)",
                borderRadius: "20px",
                padding: "30px 24px",
                width: "320px",
                textAlign: "center",
                boxShadow:
                  "0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(255,107,53,0.15)",
                animation:
                  "scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "rgba(255,107,53,0.15)",
                  color: "#FF6B35",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: "28px",
                }}
              >
                🔒
              </div>
              <h3
                style={{ margin: "0 0 10px", color: "white", fontSize: "18px" }}
              >
                Yêu cầu đăng nhập
              </h3>
              <p
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "14px",
                  margin: "0 0 24px",
                  lineHeight: "1.5",
                }}
              >
                Bạn cần đăng nhập tài khoản Ovbay để sử dụng chức năng theo dõi
                Shop và thả tim.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <button
                  onClick={handleLoginRedirect}
                  style={{
                    background:
                      "linear-gradient(135deg, #FF6B35 0%, #ff2a00 100%)",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: "12px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(255,107,53,0.4)",
                    transition: "transform 0.1s",
                  }}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.95)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  Đến trang Đăng nhập
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    border: "none",
                    padding: "12px",
                    borderRadius: "12px",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
                  }
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          </div>
        )}
      </Styled.Layout>
    </>
  );
};

export default EcommerceLayout;
