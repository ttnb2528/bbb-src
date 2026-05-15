import React, { useState, useEffect, useRef } from "react";
import { useIntl } from "react-intl";
import Styled from "../app/styles";
import WebcamContainer from "../webcam/component";
import AudioContainer from "../audio/container";
import ChatAlertContainerGraphql from "../chat/chat-graphql/alert/component";
import FloatingChatContainer from "../chat/floating-chat/container";
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
import LeaveMeetingButtonContainer from "../nav-bar/leave-meeting-button/container";

import Auth from "/imports/ui/services/auth";
import useMeeting from "/imports/ui/core/hooks/useMeeting";
import useCurrentUser from "/imports/ui/core/hooks/useCurrentUser";

import { USER_AGGREGATE_COUNT_SUBSCRIPTION } from "/imports/ui/core/graphql/queries/users";
import useDeduplicatedSubscription from "/imports/ui/core/hooks/useDeduplicatedSubscription";
import { useLoadedUserList } from "/imports/ui/core/hooks/useLoadedUserList";

// Component dành riêng cho giao diện Bán hàng
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
  const [shopInfo, setShopInfo] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(true); // Mặc định true để không chớp giật lúc load
  const [hasCameraEverStarted, setHasCameraEverStarted] = useState(false); // Theo dõi xem live đã từng bật chưa

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

  // Hook lấy role của user hiện tại
  const { data: currentUser } = useCurrentUser((u) => ({
    role: u.role,
  }));
  const isHost = currentUser?.role === "MODERATOR";

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

          // Tự động xóa thông báo sau 3 giây
          setTimeout(() => {
            setJoinNotifications((prev) =>
              prev.filter((n) => n.id !== newNotif.id),
            );
          }, 3000);
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
            if (data.success && data.data && data.data.products) {
              setProducts(data.data.products);
              if (data.data.current_pinned_product_id) {
                const p = data.data.products.find(
                  (p) => p.id == data.data.current_pinned_product_id,
                );
                if (p) setPinnedProduct(p);
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
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#000", // Nền đen cho video
          position: "relative",
          overflow: "hidden",
        }}
        className="ecommerce-mode"
      >
        <ActivityCheckContainer />
        <ScreenReaderAlertContainer />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .ecommerce-mode {
            background: radial-gradient(circle at 50% 50%, #1e1b4b, #000000) !important;
          }
          
          /* Tuyệt chiêu ép Video tràn viền tuyệt đối mà không làm hỏng thẻ div */
          .ecommerce-video-wrapper video {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            object-fit: contain !important; /* Hiển thị đủ ảnh 16:9 không bị cắt */
            border-radius: 0 !important;
            z-index: 1 !important;
            transform: none !important; /* Xoá các transform căn giữa */
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            pointer-events: none !important;
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
          .ecommerce-video-wrapper [data-test="userAvatar"],
          .ecommerce-video-wrapper [data-test="videoPreviewModal"] {
             opacity: 0 !important;
             pointer-events: none !important;
             display: none !important;
          }
        `,
          }}
        />

        {/* --- TIKTOK STYLE HOST PROFILE BADGE (Top Left) --- */}
        {isCameraActive && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              display: "flex",
              alignItems: "center",
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "40px",
              padding: "4px 16px 4px 4px",
              gap: "10px",
              zIndex: 100,
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              animation: "slideInDown 0.5s ease-out forwards",
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
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FF6B35, #ff2a00)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "18px",
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
                  fontSize: "13px",
                  lineHeight: "1.2",
                  maxWidth: "140px",
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
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: "bold",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
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
                </span>
              </div>
            </div>
            {/* Nút Follow giả lập */}
            {!isHost && (
              <button
                style={{
                  marginLeft: "6px",
                  background: "linear-gradient(90deg, #ff1e00, #ff5722)",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: "0 2px 5px rgba(255,30,0,0.4)",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                + Theo dõi
              </button>
            )}
          </div>
        )}

        {/* --- DANH SÁCH THÔNG BÁO VÀO PHÒNG (Góc dưới bên trái) --- */}
        <div
          style={{
            position: "absolute",
            bottom: "140px",
            left: "20px",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            pointerEvents: "none",
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
                maxWidth: "220px", // Fixed width
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
                style={{ color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap" }}
              >
                {t("vừa vào live", "joined")}
              </span>
            </div>
          ))}
        </div>

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
            width: "100vw",
            height: "100vh",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
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
              /* Background chờ mờ ảo cho Viewer */
              background: !isHost
                ? "url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop') center/cover no-repeat"
                : "none",
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
              bottom: "80px",
              left: "20px",
              background: "rgba(0, 0, 0, 0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              padding: "8px",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              display: "flex",
              gap: "10px",
              alignItems: "center",
              zIndex: 100,
              width: "280px",
              border: "1px solid rgba(255,255,255,0.15)",
              animation:
                "slideInLeft 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
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
                  width: "60px",
                  height: "60px",
                  objectFit: "cover",
                  borderRadius: "10px",
                }}
                alt=""
              />
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  left: "-6px",
                  background: "linear-gradient(90deg, #ff1e00, #ff5722)",
                  color: "white",
                  fontSize: "9px",
                  fontWeight: "bold",
                  padding: "2px 5px",
                  borderRadius: "10px",
                  animation: "pulseBadge 2s infinite",
                  border: "1px solid rgba(255,255,255,0.5)",
                }}
              >
                🔥 ĐANG GHIM
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: "600",
                  fontSize: "13px",
                  color: "#ffffff",
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
                  color: "#FF6B35",
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "6px",
                }}
              >
                {Number(pinnedProduct.selling_price).toLocaleString("vi-VN")}đ
              </div>

              {isHost ? (
                <button
                  onClick={handleUnpinProduct}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.1)",
                    color: "#e2e8f0",
                    border: "1px solid rgba(255,255,255,0.2)",
                    padding: "4px 0",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "11px",
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
                  ✕ Bỏ Ghim
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
                      "linear-gradient(90deg, #ff6b35 0%, #ff8e53 100%)",
                    color: "white",
                    border: "none",
                    padding: "4px 0",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 8px rgba(255,107,53,0.4)",
                  }}
                >
                  🛒 MUA NGAY
                </a>
              )}
            </div>
          </div>
        )}

        {/* Khung Chat nổi lên trên video */}
        <div
          className="ecommerce-chat-overlay"
          style={{
            position: "absolute",
            bottom: "0px", // Đẩy cao lên tránh Action Bar
            right: "10px", // Đưa Chat sang BÊN PHẢI
            width: "360px",
            height: "50%",
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <FloatingChatContainer />
        </div>

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

        {/* Nút Giỏ Hàng Floating */}
        <button
          onClick={() => setShowProductPanel(!showProductPanel)}
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px", // Đưa Giỏ Hàng sang BÊN TRÁI
            padding: "12px 24px",
            background: "linear-gradient(135deg, #FF6B35 0%, #F97316 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "30px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            boxShadow: "0 4px 15px rgba(255, 107, 53, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 30,
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <span style={{ fontSize: "20px" }}>🛍️</span> Giỏ Hàng
        </button>

        {/* Thanh công cụ Custom (Mic, Cam, Kết thúc Live) thay thế ActionsBar */}
        <div
          className="ecommerce-custom-controls"
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            display: "flex",
            gap: "12px",
            zIndex: 40,
            alignItems: "center",
          }}
        >
          {isHost && (
            <>
              <AudioControlsContainer />
              <JoinVideoOptionsContainer />
            </>
          )}
          <LeaveMeetingButtonContainer />
        </div>

        {/* Product Panel Overlay (TikTok Shop Style) */}
        {showProductPanel && (
          <div
            style={{
              position: "absolute",
              bottom: "70px",
              left: "20px",
              width: "320px",
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "20px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              padding: "16px",
              zIndex: 100,
              maxHeight: "65vh",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.3s ease-out forwards",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
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
                  fontSize: "16px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                🛍️ Cửa hàng
              </h3>
              <button
                onClick={() => setShowProductPanel(false)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
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
                          ? "rgba(255, 107, 53, 0.15)"
                          : "rgba(255,255,255,0.05)",
                        borderRadius: "12px",
                        border: isPinned
                          ? "1px solid rgba(255, 107, 53, 0.5)"
                          : "1px solid rgba(255,255,255,0.05)",
                        alignItems: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <img
                        src={
                          p.image_urls?.[0] || "https://via.placeholder.com/60"
                        }
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "8px",
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
                              ? "rgba(255,255,255,0.1)"
                              : "linear-gradient(90deg, #ff6b35 0%, #ff8e53 100%)",
                            color: isPinned ? "#94a3b8" : "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "16px",
                            cursor: isPinned ? "not-allowed" : "pointer",
                            fontSize: "11px",
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isPinned ? "Đã ghim" : "📌 Ghim"}
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
      </Styled.Layout>
    </>
  );
};

export default EcommerceLayout;
