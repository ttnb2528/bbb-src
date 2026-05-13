import React, { useState, useEffect } from "react";
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

  const [showProductPanel, setShowProductPanel] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true); // Mặc định true để không chớp giật lúc load

  // Dùng useEffect và Interval để "soi" xem thẻ video có thực sự đang chạy (live) hay không
  useEffect(() => {
    const checkCamera = () => {
      const videos = document.querySelectorAll(
        ".ecommerce-video-wrapper video",
      );
      let active = false;
      videos.forEach((v) => {
        // Kiểm tra xem thẻ video có gắn luồng stream không và track video có đang 'live' không
        if (v.srcObject && typeof v.srcObject.getVideoTracks === "function") {
          const tracks = v.srcObject.getVideoTracks();
          if (tracks.length > 0 && tracks[0].readyState === "live") {
            active = true;
          }
        }
      });
      setIsCameraActive(active);
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

  // Hook lấy role của user hiện tại
  const { data: currentUser } = useCurrentUser((u) => ({
    role: u.role,
  }));
  const isHost = currentUser?.role === "MODERATOR";

  // Hook lấy thông tin Meeting hiện tại để lấy MeetingID gửi về ovbay
  const { data: currentMeeting } = useMeeting((m) => ({
    meetingId: m.meetingId,
    extId: m.extId,
    metadata: m.metadata,
  }));

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

  // Hàm xử lý Mua Ngay với Picture-in-Picture
  const triggerPiPAndNavigate = async (product) => {
    try {
      const videos = document.querySelectorAll(
        ".ecommerce-video-wrapper video, video",
      );
      let mainVideo = null;
      for (const v of videos) {
        if (v.readyState !== 0 && !v.paused) {
          mainVideo = v;
          break;
        }
      }

      if (mainVideo && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement !== mainVideo) {
          await mainVideo.requestPictureInPicture();
        }
      }
    } catch (e) {
      console.warn("Không thể bật PiP:", e);
    }

    // Mở trang sản phẩm
    try {
      const storefrontUrl =
        currentMeeting?.metadata?.storefrontUrl || "http://localhost:3000";
      const productLink = `${storefrontUrl}/main/products/${product.id}`;
      window.open(productLink, "_blank");
    } catch (err) {
      window.open(
        `http://localhost:3000/main/products/${product.id}`,
        "_blank",
      );
    }
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
            background-color: #000 !important;
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
            background-color: #000 !important;
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
          .ecommerce-custom-controls > * {
             display: inline-block;
          }
          .ecommerce-custom-controls button {
             width: 48px !important;
             height: 48px !important;
             border-radius: 50% !important;
             background: rgba(0, 0, 0, 0.4) !important;
             backdrop-filter: blur(10px) !important;
             -webkit-backdrop-filter: blur(10px) !important;
             border: 1px solid rgba(255, 255, 255, 0.2) !important;
             color: white !important;
             box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
             display: flex !important;
             align-items: center !important;
             justify-content: center !important;
             transition: all 0.2s ease !important;
             cursor: pointer !important;
             padding: 0 !important;
          }
          .ecommerce-custom-controls button:hover {
             background: rgba(255, 255, 255, 0.2) !important;
             transform: scale(1.08) !important;
             border: 1px solid rgba(255, 255, 255, 0.4) !important;
          }
          .ecommerce-custom-controls button i {
             font-size: 20px !important;
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
          
          /* Ẩn cục Avatar mặc định của BBB khi chưa có Camera */
          .ecommerce-video-wrapper-inactive > div {
             opacity: 0 !important;
             pointer-events: none !important;
          }
        `,
          }}
        />

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
              display: "flex", // Đảm bảo ghi đè thành flex khi hiển thị
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 5,
              pointerEvents: "none",
              color: "white",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.6)",
                padding: "30px 40px",
                borderRadius: "16px",
                backdropFilter: "blur(10px)",
                pointerEvents: "auto",
                border: "1px solid rgba(255,107,53,0.5)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              <h2
                style={{
                  color: "#FF6B35",
                  marginBottom: "15px",
                  fontSize: "24px",
                }}
              >
                📸 Camera đang tắt!
              </h2>
              <p
                style={{
                  fontSize: "16px",
                  marginBottom: "10px",
                  lineHeight: "1.5",
                }}
              >
                Vui lòng bấm vào nút <b>Bật Camera</b> ở thanh công cụ bên dưới
                <br />
                để bắt đầu phiên Live Commerce.
              </p>
              <div
                style={{
                  marginTop: "20px",
                  padding: "10px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              >
                <p style={{ fontSize: "13px", color: "#ddd", margin: 0 }}>
                  ⚠️ <b>Lưu ý:</b> Nếu bạn lỡ bấm "Chặn" quyền Camera/Mic,
                  <br />
                  hãy click vào biểu tượng <b>Ổ khóa (🔒)</b> trên thanh địa chỉ
                  trình duyệt
                  <br />
                  để cấp lại quyền "Cho phép" và tải lại trang nhé.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- OVERLAY SẢN PHẨM ĐANG GHIM --- */}
        {pinnedProduct && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              padding: "12px",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              display: "flex",
              gap: "12px",
              alignItems: "center",
              zIndex: 100,
              maxWidth: "350px",
              border: "1px solid rgba(255, 107, 53, 0.3)",
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
                  "https://via.placeholder.com/80"
                }
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
                alt=""
              />
              <div
                style={{
                  position: "absolute",
                  top: "-8px",
                  left: "-8px",
                  background: "#ff1e00",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: "bold",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  animation: "pulseBadge 2s infinite",
                  border: "2px solid white",
                }}
              >
                🔥 ĐANG GIỚI THIỆU
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  color: "#1a1a1a",
                  marginBottom: "4px",
                  lineHeight: "1.2",
                }}
              >
                {pinnedProduct.name.length > 35
                  ? pinnedProduct.name.substring(0, 35) + "..."
                  : pinnedProduct.name}
              </div>
              <div
                style={{
                  color: "#ff6b35",
                  fontWeight: "900",
                  fontSize: "16px",
                  marginBottom: "8px",
                }}
              >
                {Number(pinnedProduct.selling_price).toLocaleString("vi-VN")}đ
              </div>

              {isHost ? (
                <button
                  onClick={handleUnpinProduct}
                  style={{
                    width: "100%",
                    background: "#f1f5f9",
                    color: "#64748b",
                    border: "none",
                    padding: "6px 0",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  ✖ Bỏ Ghim
                </button>
              ) : (
                <button
                  onClick={() => triggerPiPAndNavigate(pinnedProduct)}
                  style={{
                    width: "100%",
                    background:
                      "linear-gradient(90deg, #ff6b35 0%, #ff8e53 100%)",
                    color: "white",
                    border: "none",
                    padding: "6px 0",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 8px rgba(255,107,53,0.4)",
                  }}
                >
                  🛒 MUA NGAY
                </button>
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
            bottom: "90px",
            left: "20px", // Đưa Giỏ Hàng sang BÊN TRÁI (Ngang với Chat)
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
            transition: "all 0.2s ease",
          }}
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
              bottom: "80px",
              left: "20px",
              width: "340px",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "20px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              padding: "20px",
              zIndex: 100,
              maxHeight: "65vh",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.3s ease-out forwards",
              border: "1px solid rgba(255,255,255,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
                borderBottom: "2px solid #f1f5f9",
                paddingBottom: "12px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: "18px",
                  fontWeight: "800",
                }}
              >
                🛍️ Danh sách sản phẩm
              </h3>
              <button
                onClick={() => setShowProductPanel(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                  fontWeight: "bold",
                }}
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
                products.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "stretch",
                      gap: "12px",
                      padding: "10px",
                      background: "#ffffff",
                      borderRadius: "14px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      border: "1px solid #f8fafc",
                      transition: "transform 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.02)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <div style={{ position: "relative" }}>
                      <img
                        src={
                          p.image_urls && p.image_urls.length > 0
                            ? p.image_urls[0]
                            : "https://via.placeholder.com/100"
                        }
                        alt={p.name}
                        style={{
                          width: "70px",
                          height: "70px",
                          borderRadius: "10px",
                          objectFit: "cover",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "14px",
                          color: "#1e293b",
                          lineHeight: "1.3",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                        }}
                      >
                        <div
                          style={{
                            color: "#ef4444",
                            fontWeight: "900",
                            fontSize: "15px",
                          }}
                        >
                          {p.selling_price
                            ? new Intl.NumberFormat("vi-VN").format(
                                p.selling_price,
                              )
                            : 0}
                          đ
                        </div>
                        {isHost ? (
                          <button
                            onClick={() => handlePinProduct(p)}
                            style={{
                              padding: "6px 14px",
                              background:
                                "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "20px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                              boxShadow: "0 2px 5px rgba(14, 165, 233, 0.4)",
                            }}
                          >
                            📌 Ghim
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerPiPAndNavigate(p)}
                            style={{
                              padding: "6px 14px",
                              background:
                                "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "20px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "bold",
                              boxShadow: "0 2px 5px rgba(249, 115, 22, 0.4)",
                            }}
                          >
                            Mua ngay
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Styled.Layout>
    </>
  );
};

export default EcommerceLayout;
