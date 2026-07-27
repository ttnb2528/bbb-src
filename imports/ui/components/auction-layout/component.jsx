import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import Styled from "../app/styles";
import WebcamContainer from "../webcam/component";
import AudioContainer from "../audio/container";
import ActivityCheckContainer from "/imports/ui/components/activity-check/container";
import ScreenReaderAlertContainer from "../screenreader-alert/container";
import Notifications from "../notifications/component";
import AudioControlsContainer from "../audio/audio-graphql/audio-controls/component";
import JoinVideoOptionsContainer from "../video-provider/video-button/container";
import Auth from "/imports/ui/services/auth";
import Session from "/imports/ui/services/storage/in-memory";
import { USER_LEAVE_MEETING } from "/imports/ui/core/graphql/mutations/userMutations";
import { MEETING_END } from "/imports/ui/components/end-meeting-confirmation/mutations";
import useMeeting from "/imports/ui/core/hooks/useMeeting";
import useCurrentUser from "/imports/ui/core/hooks/useCurrentUser";
import AuctionVehicleCard from "./auction-vehicle-card";
import AuctionBidPanel from "./auction-bid-panel";
import AuctionChat from "./auction-chat";

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

const readMeta = (metadata, key) =>
  metadata?.[`meta_${key}`] ?? metadata?.[key] ?? null;

/** Rewrite loopback hosts so BBB clients (Tailscale / phone) can reach OVCar. */
const rewritePublicHost = (urlString) => {
  if (!urlString || typeof window === "undefined") return urlString;
  try {
    const url = new URL(urlString);
    const pageHost = window.location.hostname;
    const isPageLocal =
      pageHost === "localhost" || pageHost === "127.0.0.1";
    const isApiLocal =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (isApiLocal && !isPageLocal) {
      url.hostname = "100.125.154.13";
    }
    return url.origin;
  } catch (_e) {
    return urlString;
  }
};

const uniqueBases = (candidates) => {
  const out = [];
  candidates.forEach((raw) => {
    if (!raw) return;
    const base = String(raw).replace(/\/$/, "");
    if (base && !out.includes(base)) out.push(base);
  });
  return out;
};

const OVCAR_TOKEN_STORAGE_KEY = "ovcar-auth-token";

const persistOvcarToken = (token) => {
  if (!token || typeof window === "undefined") return;
  window.ovcarAuthToken = token;
  try {
    sessionStorage.setItem(OVCAR_TOKEN_STORAGE_KEY, token);
  } catch (_e) {
    // ignore
  }
  try {
    localStorage.setItem(OVCAR_TOKEN_STORAGE_KEY, token);
  } catch (_e) {
    // ignore
  }
};

const extractOvcarTokenFromUrl = (href) => {
  if (!href) return null;
  try {
    const url = new URL(href);
    return (
      url.searchParams.get("userdata-ovcar_token") ||
      url.searchParams.get("ovcar_token") ||
      url.searchParams.get("userdata-ovcarToken") ||
      null
    );
  } catch (_e) {
    return null;
  }
};

const resolveOvcarToken = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery =
      params.get("userdata-ovcar_token") || params.get("ovcar_token");
    if (fromQuery) {
      persistOvcarToken(fromQuery);
      return fromQuery;
    }
  } catch (_e) {
    // ignore
  }

  if (typeof window !== "undefined" && window.ovcarAuthToken) {
    return window.ovcarAuthToken;
  }

  try {
    const fromSession = sessionStorage.getItem(OVCAR_TOKEN_STORAGE_KEY);
    if (fromSession) return fromSession;
  } catch (_e) {
    // ignore
  }

  try {
    const fromLocal = localStorage.getItem(OVCAR_TOKEN_STORAGE_KEY);
    if (fromLocal) return fromLocal;
  } catch (_e) {
    // ignore
  }

  try {
    if (Auth?.userdata?.ovcar_token) {
      persistOvcarToken(Auth.userdata.ovcar_token);
      return Auth.userdata.ovcar_token;
    }
  } catch (_e) {
    // ignore
  }

  return null;
};

const AuctionLayout = (props) => {
  const {
    isAudioModalOpen,
    setAudioModalIsOpen,
    isVideoPreviewModalOpen,
    setVideoPreviewModalIsOpen,
    hideActionsBar,
  } = props;

  const { data: currentMeeting } = useMeeting((m) => ({
    meetingId: m?.meetingId,
    extId: m?.extId,
    metadata: m?.metadata,
    name: m?.name,
  }));

  const { data: currentUser } = useCurrentUser((u) => ({
    userId: u?.userId,
    name: u?.name,
    role: u?.role,
    extId: u?.extId,
  }));

  const isHost = currentUser?.role === "MODERATOR";
  const [isRealDesktop, setIsRealDesktop] = useState(
    typeof window !== "undefined" ? !shouldUseMobileShell() : true,
  );
  const isMobile = !isRealDesktop;

  const [apiBase, setApiBase] = useState("http://localhost:8000");
  const [storefrontUrl, setStorefrontUrl] = useState("http://localhost:3000");
  const [meetingId, setMeetingId] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [listing, setListing] = useState(null);
  const [auctionLive, setAuctionLive] = useState(null);
  const [bidEvents, setBidEvents] = useState([]);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());
  const lastBidAtRef = useRef(null);
  const pusherRef = useRef(null);
  const [userLeaveMeeting] = useMutation(USER_LEAVE_MEETING);
  const [meetingEnd] = useMutation(MEETING_END);

  const handleExitLive = async () => {
    try {
      if (isHost) {
        await meetingEnd();
        return;
      }
      await userLeaveMeeting();
      Session.setItem("codeError", "680");
    } catch (error) {
      console.error("Không thể thoát phiên auction:", error);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsRealDesktop(!shouldUseMobileShell());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.classList.add("ovcar-auction-live-active");
    return () => {
      document.body.classList.remove("ovcar-auction-live-active");
    };
  }, []);

  useEffect(() => {
    setAuthToken(resolveOvcarToken());

    const syncToken = () => {
      const token = resolveOvcarToken();
      if (token) setAuthToken(token);
    };

    const onMessage = (event) => {
      const data = event?.data;
      if (!data || typeof data !== "object") return;
      if (
        (data.type === "ovcar:auth" || data.type === "OVCAR_AUTH") &&
        typeof data.token === "string" &&
        data.token
      ) {
        persistOvcarToken(data.token);
        setAuthToken(data.token);
      }
    };

    window.addEventListener("focus", syncToken);
    document.addEventListener("visibilitychange", syncToken);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("focus", syncToken);
      document.removeEventListener("visibilitychange", syncToken);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const applyDetails = useCallback((data) => {
    if (!data) return;
    if (data.listing) setListing(data.listing);
    if (data.listing_id) setListingId(data.listing_id);
    if (data.auction_live) {
      setAuctionLive(data.auction_live);
      if (data.auction_live.server_time) {
        setClockOffsetMs(
          Date.parse(data.auction_live.server_time) - Date.now(),
        );
      }
    }
  }, []);

  const appendBidEvent = useCallback((lastBid) => {
    if (!lastBid) return;
    const placedAt = lastBid.placed_at || null;
    if (placedAt && lastBidAtRef.current === placedAt) return;
    if (placedAt) lastBidAtRef.current = placedAt;

    setBidEvents((prev) => {
      const next = [
        ...prev,
        {
          id: `${lastBid.bidder_account_id || "x"}-${placedAt || Date.now()}`,
          bidder_display: lastBid.bidder_display,
          amount: lastBid.amount,
          placed_at: placedAt,
          ts: placedAt ? Date.parse(placedAt) : Date.now(),
        },
      ];
      return next.slice(-40);
    });
  }, []);

  // Fetch room details once meeting metadata is ready
  useEffect(() => {
    if (!currentMeeting) return;

    const metadata = currentMeeting.metadata || {};
    const metaApi =
      readMeta(metadata, "apiUrl") ||
      (() => {
        try {
          return Auth.logoutURL ? new URL(Auth.logoutURL).origin : null;
        } catch (_e) {
          return null;
        }
      })();

    const sfUrl =
      readMeta(metadata, "storefrontUrl") || "http://localhost:3001";
    const mId =
      readMeta(metadata, "meetingId") ||
      currentMeeting.extId ||
      currentMeeting.meetingId ||
      Auth.meetingID;
    const lId = readMeta(metadata, "listingId");

    const storefront = rewritePublicHost(sfUrl) || String(sfUrl).replace(/\/$/, "");
    const apiCandidates = uniqueBases([
      rewritePublicHost(metaApi),
      metaApi,
      storefront,
      rewritePublicHost("http://localhost:3001"),
      rewritePublicHost("http://localhost:8000"),
      "http://100.125.154.13:3001",
      "http://100.125.154.13:8000",
      "http://localhost:3001",
      "http://localhost:8000",
    ]);

    setStorefrontUrl(storefront);
    setMeetingId(mId);
    if (lId) setListingId(Number(lId) || lId);

    if (!mId) return;

    let cancelled = false;
    const load = async () => {
      for (const base of apiCandidates) {
        if (cancelled) return;
        try {
          const res = await fetch(`${base}/api/livestream/${mId}/details`);
          if (!res.ok) continue;
          const json = await res.json();
          if (!cancelled && json.success) {
            setApiBase(base);
            applyDetails(json.data);
            return;
          }
        } catch (_err) {
          // try next base
        }
      }
      console.error("OVCAR livestream details: all API bases failed", apiCandidates);
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [currentMeeting, applyDetails]);

  // Reverb subscribe for bid.placed (+ poll fallback)
  useEffect(() => {
    if (!meetingId || !listingId) return undefined;

    const metadata = currentMeeting?.metadata || {};
    const reverbKey = readMeta(metadata, "reverbKey");
    const reverbHost = readMeta(metadata, "reverbHost") || "localhost";
    const reverbPort = readMeta(metadata, "reverbPort") || "8080";
    const reverbScheme = readMeta(metadata, "reverbScheme") || "http";

    const handleBidPayload = (payload) => {
      if (!payload) return;
      setAuctionLive((prev) => ({ ...(prev || {}), ...payload }));
      if (payload.server_time) {
        setClockOffsetMs(Date.parse(payload.server_time) - Date.now());
      }
      if (payload.last_bid) {
        appendBidEvent(payload.last_bid);
      }
    };

    let pollTimer = null;

    const startPollFallback = () => {
      pollTimer = window.setInterval(async () => {
        try {
          const res = await fetch(
            `${apiBase}/api/livestream/${meetingId}/details`,
          );
          if (!res.ok) return;
          const json = await res.json();
          if (json.success) {
            applyDetails(json.data);
            // Do not invent bid chat lines from poll without last_bid identity
          }
        } catch (_e) {
          // ignore
        }
      }, 4000);
    };

    const setupPusher = () => {
      if (!window.Pusher || !reverbKey) {
        startPollFallback();
        return;
      }

      try {
        const pusher = new window.Pusher(reverbKey, {
          wsHost: reverbHost,
          wsPort: Number(reverbPort),
          wssPort: Number(reverbPort),
          forceTLS: reverbScheme === "https",
          disableStats: true,
          enabledTransports: ["ws", "wss"],
          cluster: "mt1",
        });
        pusherRef.current = pusher;
        const channel = pusher.subscribe(`auction.${listingId}`);
        channel.bind("bid.placed", handleBidPayload);
      } catch (err) {
        console.error("OVCAR Reverb setup failed:", err);
        startPollFallback();
      }
    };

    if (reverbKey) {
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
      startPollFallback();
    }

    return () => {
      if (pollTimer) window.clearInterval(pollTimer);
      try {
        if (pusherRef.current) {
          pusherRef.current.unsubscribe(`auction.${listingId}`);
          pusherRef.current.disconnect();
          pusherRef.current = null;
        }
      } catch (_e) {
        // ignore
      }
    };
  }, [
    meetingId,
    listingId,
    apiBase,
    currentMeeting,
    applyDetails,
    appendBidEvent,
  ]);

  const handleLogin = () => {
    const redirectTarget = `${storefrontUrl}/live/${meetingId || ""}`;
    const loginUrl = `${storefrontUrl}/login?redirect=${encodeURIComponent(
      redirectTarget,
    )}`;

    // Không dùng noopener để tab meeting có thể đọc join URL (cùng origin BBB)
    // sau khi storefront login xong và redirect sang bigbluebutton/api/join?...&userdata-ovcar_token=
    const popup = window.open(
      loginUrl,
      "ovcar_login",
      "width=480,height=720,menubar=no,toolbar=no,noopener=no",
    );

    if (!popup) {
      window.location.href = loginUrl;
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (!popup || popup.closed) {
        window.clearInterval(timer);
        const token = resolveOvcarToken();
        if (token) setAuthToken(token);
        return;
      }

      // Timeout 3 phút
      if (Date.now() - startedAt > 180000) {
        window.clearInterval(timer);
        return;
      }

      try {
        const href = popup.location.href;
        if (!href || href === "about:blank") return;

        const tokenFromUrl = extractOvcarTokenFromUrl(href);
        if (tokenFromUrl) {
          persistOvcarToken(tokenFromUrl);
          setAuthToken(tokenFromUrl);
          window.clearInterval(timer);
          try {
            popup.close();
          } catch (_e) {
            // ignore
          }
          return;
        }
      } catch (_err) {
        // Cross-origin (đang ở storefront) — chờ tới khi nhảy sang BBB join URL
      }
    }, 400);
  };

  const handleBid = async (amount) => {
    if (!listingId) return;
    if (!authToken) {
      handleLogin();
      return;
    }

    setIsSubmittingBid(true);
    try {
      const res = await fetch(`${apiBase}/api/listings/${listingId}/bid`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          mode: "instant",
          amount: Number(amount),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        window.alert(json.message || "Bid failed");
      }
    } catch (err) {
      console.error(err);
      window.alert("Unable to place bid");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const serverNowMs = nowTick + clockOffsetMs;

  return (
    <>
      <Styled.Layout
        id="ovcar-auction-layout"
        className="ovcar-auction-layout-container ovcar-auction-mode"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          background:
            "radial-gradient(circle at top left, rgba(225,6,0,0.18) 0%, transparent 30%), linear-gradient(180deg, #120a0a 0%, #090909 55%, #050505 100%)",
          overflow: "hidden",
          zIndex: 9999,
          margin: 0,
        }}
      >
        <ActivityCheckContainer />
        <ScreenReaderAlertContainer />
        <Notifications />

        <style
          dangerouslySetInnerHTML={{
            __html: `
          body.ovcar-auction-live-active { overflow: hidden !important; }

          /* Ẩn tooltip/toast "Click Unmute..." trong OVCar */
          body.ovcar-auction-live-active [data-debug="live-watcher"],
          .ovcar-auction-controls [data-debug="live-watcher"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          .ovcar-auction-video-wrapper [data-test="videoStripWrapper"],
          .ovcar-auction-video-wrapper [data-test="videoStrip"] {
            display: none !important;
          }

          /* Ép webcam/avatar phủ toàn màn hình trong layout OVCar */
          .ovcar-auction-video-wrapper,
          .ovcar-auction-video-wrapper > div {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
          }

          .ovcar-auction-video-wrapper #cameraDock,
          .ovcar-auction-video-wrapper #cameraDock > div,
          .ovcar-auction-video-wrapper #cameraDock div {
            box-sizing: border-box !important;
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
            min-width: 0 !important;
            min-height: 0 !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
            overflow: hidden !important;
            transform: none !important;
            gap: 0 !important;
            row-gap: 0 !important;
            column-gap: 0 !important;
            grid-gap: 0 !important;
          }

          .ovcar-auction-video-wrapper #cameraDock,
          .ovcar-auction-video-wrapper #cameraDock > div {
            position: absolute !important;
            inset: 0 !important;
          }

          .ovcar-auction-video-wrapper [data-test="webcamItem"],
          .ovcar-auction-video-wrapper [data-test="webcamItemTalkingUser"],
          .ovcar-auction-video-wrapper .videoContainer,
          .ovcar-auction-video-wrapper [data-test="videoContainer"],
          .ovcar-auction-video-wrapper [data-test="mirroredVideoContainer"],
          .ovcar-auction-video-wrapper [data-test="webcamItem"] > div,
          .ovcar-auction-video-wrapper [data-test="webcamItemTalkingUser"] > div {
            position: absolute !important;
            inset: 0 !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
          }

          .ovcar-auction-video-wrapper video,
          .ovcar-auction-video-wrapper [data-test="videoContainer"] video,
          .ovcar-auction-video-wrapper [data-test="mirroredVideoContainer"] video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: center center !important;
            background: transparent !important;
          }

          .ovcar-auction-video-wrapper [class*="videoInfo"],
          .ovcar-auction-video-wrapper [class*="dropdown"],
          .ovcar-auction-video-wrapper [data-test="videoListItem"] span,
          .ovcar-auction-video-wrapper [data-test="videoListItem"] button {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }

          body.ovcar-auction-live-active .ReactModalPortal {
            position: relative;
            z-index: 20000 !important;
          }
          body.ovcar-auction-live-active .ReactModalPortal .ReactModal__Overlay,
          body.ovcar-auction-live-active .ReactModalPortal .modalOverlay {
            z-index: 20000 !important;
          }
          body.ovcar-auction-live-active .ReactModalPortal .ReactModal__Content {
            z-index: 20001 !important;
          }
          body.ovcar-auction-live-active .ReactModalPortal [data-test="audioModal"],
          body.ovcar-auction-live-active .ReactModalPortal [data-test="webcamSettingsModal"] {
            z-index: 20001 !important;
          }

          body.ovcar-auction-live-active #modals-container {
            position: relative !important;
            z-index: 25000 !important;
          }
          body.ovcar-auction-live-active #modals-container .modal-low,
          body.ovcar-auction-live-active #modals-container .modal-medium,
          body.ovcar-auction-live-active #modals-container .modal-high {
            display: block !important;
            z-index: 25001 !important;
          }
          body.ovcar-auction-live-active #modals-container .ReactModal__Overlay,
          body.ovcar-auction-live-active #modals-container .modalOverlay {
            z-index: 25001 !important;
          }
          body.ovcar-auction-live-active #modals-container [data-test="webcamSettingsModal"],
          body.ovcar-auction-live-active #modals-container [data-test="audioModal"] {
            display: block !important;
            position: relative !important;
            z-index: 25002 !important;
            pointer-events: auto !important;
          }

          #app[aria-hidden="true"] #ovcar-auction-layout {
            pointer-events: none !important;
          }
          #app[aria-hidden="true"] #ovcar-auction-layout * {
            pointer-events: none !important;
          }
        `,
          }}
        />

        <div
          className="ovcar-auction-video-wrapper"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(20,10,10,0.96) 0%, rgba(8,8,8,0.98) 100%)",
          }}
        >
          <WebcamContainer />
        </div>

        <div
          className="ovcar-auction-left-stack"
          style={{
            position: "absolute",
            bottom: isMobile ? "240px" : "24px",
            left: isMobile ? "12px" : "20px",
            zIndex: 20,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "stretch",
            width: isMobile ? "min(260px, calc(100% - 24px))" : "280px",
            maxWidth: isMobile ? "calc(100% - 24px)" : "280px",
            pointerEvents: "none",
          }}
        >
          <AuctionVehicleCard
            listing={listing}
            auctionLive={auctionLive}
            storefrontUrl={storefrontUrl}
            isMobile={isMobile}
          />

          {!isHost && (
            <AuctionBidPanel
              auctionLive={auctionLive}
              isMobile={isMobile}
              isLoggedIn={Boolean(authToken)}
              isSubmitting={isSubmittingBid}
              onBid={handleBid}
              onLogin={handleLogin}
              serverNowMs={serverNowMs}
            />
          )}
        </div>

        <AuctionChat
          isMobile={isMobile}
          isHost={isHost}
          bidEvents={bidEvents}
        />

        <AudioContainer
          isAudioModalOpen={isAudioModalOpen}
          setAudioModalIsOpen={setAudioModalIsOpen}
          isVideoPreviewModalOpen={isVideoPreviewModalOpen}
          setVideoPreviewModalIsOpen={setVideoPreviewModalIsOpen}
        />

        {!hideActionsBar && (
          <div
            className="ovcar-auction-controls"
            style={{
              position: "absolute",
              ...(isMobile
                ? { left: "10px", right: "auto" }
                : { right: "392px" }),
              bottom: isMobile ? "10px" : "24px",
              zIndex: 50,
              display: "flex",
              flexDirection: "row",
              gap: "10px",
              alignItems: "center",
            }}
          >
            {isHost && (
              <>
                <AudioControlsContainer />
                <JoinVideoOptionsContainer />
              </>
            )}
            <button
              type="button"
              className="ovcar-auction-exit-btn"
              onClick={handleExitLive}
              aria-label={isHost ? "Kết thúc phiên" : "Thoát phiên"}
              title={isHost ? "Kết thúc phiên" : "Thoát phiên"}
              style={{
                width: isMobile ? "40px" : "44px",
                height: isMobile ? "40px" : "44px",
                borderRadius: "50%",
                border: "1px solid rgba(239,68,68,0.45)",
                background: "rgba(239, 68, 68, 0.88)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? "18px" : "22px",
                fontWeight: 700,
                lineHeight: 1,
                cursor: "pointer",
                boxShadow: "0 10px 28px rgba(239,68,68,0.28)",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        )}
      </Styled.Layout>
    </>
  );
};

export default AuctionLayout;
