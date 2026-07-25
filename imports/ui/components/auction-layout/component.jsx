import React, { useCallback, useEffect, useRef, useState } from "react";
import Styled from "../app/styles";
import WebcamContainer from "../webcam/component";
import AudioContainer from "../audio/container";
import ActivityCheckContainer from "/imports/ui/components/activity-check/container";
import ScreenReaderAlertContainer from "../screenreader-alert/container";
import Notifications from "../notifications/component";
import AudioControlsContainer from "../audio/audio-graphql/audio-controls/component";
import JoinVideoOptionsContainer from "../video-provider/video-button/container";
import Auth from "/imports/ui/services/auth";
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

const resolveOvcarToken = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery =
      params.get("userdata-ovcar_token") || params.get("ovcar_token");
    if (fromQuery) return fromQuery;
  } catch (_e) {
    // ignore
  }

  if (typeof window !== "undefined" && window.ovcarAuthToken) {
    return window.ovcarAuthToken;
  }

  try {
    if (Auth?.userdata?.ovcar_token) return Auth.userdata.ovcar_token;
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
    const redirect = `${storefrontUrl}/login?redirect=${encodeURIComponent(
      `${storefrontUrl}/live/${meetingId || ""}`,
    )}`;
    window.open(redirect, "_blank", "noopener,noreferrer");
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
          .ovcar-auction-video-wrapper [data-test="videoStripWrapper"],
          .ovcar-auction-video-wrapper [data-test="videoStrip"] {
            display: none !important;
          }
          .ovcar-auction-video-wrapper video {
            object-fit: contain !important;
            object-position: center center !important;
            background: transparent !important;
          }
          body.ovcar-auction-live-active .ReactModalPortal,
          body.ovcar-auction-live-active #modals-container {
            z-index: 25000 !important;
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

        <AuctionVehicleCard
          listing={listing}
          auctionLive={auctionLive}
          storefrontUrl={storefrontUrl}
          isMobile={isMobile}
        />

        <AuctionBidPanel
          auctionLive={auctionLive}
          isMobile={isMobile}
          isLoggedIn={Boolean(authToken)}
          isSubmitting={isSubmittingBid}
          onBid={handleBid}
          onLogin={handleLogin}
          serverNowMs={serverNowMs}
        />

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
            style={{
              position: "absolute",
              right: isMobile ? "10px" : "20px",
              bottom: isMobile ? "10px" : "24px",
              zIndex: 30,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <AudioControlsContainer />
            {isHost ? <JoinVideoOptionsContainer /> : null}
          </div>
        )}
      </Styled.Layout>
    </>
  );
};

export default AuctionLayout;
