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
import useUserSettings, {
  localUserSettings,
} from "/imports/ui/core/local-states/useUserSettings";
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

/** Public OVCar deploy (no domain yet). BBB clients must reach this origin. */
const OVCAR_PUBLIC_ORIGIN = "http://159.198.42.40:8082";
const OVCAR_PUBLIC_HOST = "159.198.42.40";

/** Rewrite loopback / old Tailscale hosts so BBB clients can reach OVCar. */
const rewritePublicHost = (urlString) => {
  if (!urlString || typeof window === "undefined") return urlString;
  try {
    const url = new URL(urlString);
    const pageHost = window.location.hostname;
    const isPageLocal =
      pageHost === "localhost" || pageHost === "127.0.0.1";
    const isApiLocal =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isLegacyTailscale = url.hostname === "100.125.154.13";
    if ((isApiLocal && !isPageLocal) || isLegacyTailscale) {
      return OVCAR_PUBLIC_ORIGIN;
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

/**
 * Resolve OVCar API bases for livestream bid/deposit calls.
 * Prefer meeting metadata, then the public deploy origin.
 */
const buildApiCandidates = (metaApi, storefront) => {
  const pageHost =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const onLoopback = pageHost === "localhost" || pageHost === "127.0.0.1";

  if (onLoopback) {
    return uniqueBases([
      rewritePublicHost(metaApi),
      metaApi,
      storefront,
      "http://localhost:8000",
      "http://127.0.0.1:8000",
      "http://localhost:3001",
      OVCAR_PUBLIC_ORIGIN,
    ]);
  }

  // Browser is on BBB / phone / public host — prefer public OVCar.
  return uniqueBases([
    rewritePublicHost(metaApi),
    metaApi,
    rewritePublicHost(storefront),
    storefront,
    OVCAR_PUBLIC_ORIGIN,
  ]);
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

const tokenFromUserSettings = (settings) => {
  if (!settings || typeof settings !== "object") return null;
  const candidates = [
    settings.ovcar_token,
    settings["userdata-ovcar_token"],
    settings.ovcarToken,
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    const value = candidates[i];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
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

  // BBB strips userdata-* from the HTML5 URL; token lives in /userMetadata.
  try {
    const fromMeta = tokenFromUserSettings(localUserSettings());
    if (fromMeta) {
      persistOvcarToken(fromMeta);
      return fromMeta;
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

  const [userSettings] = useUserSettings();

  const isHost = currentUser?.role === "MODERATOR";
  const [isRealDesktop, setIsRealDesktop] = useState(
    typeof window !== "undefined" ? !shouldUseMobileShell() : true,
  );
  const isMobile = !isRealDesktop;

  const [apiBase, setApiBase] = useState(OVCAR_PUBLIC_ORIGIN);
  const [storefrontUrl, setStorefrontUrl] = useState(OVCAR_PUBLIC_ORIGIN);
  const [meetingId, setMeetingId] = useState(null);
  const [listingId, setListingId] = useState(null);
  const [listing, setListing] = useState(null);
  const [auctionLive, setAuctionLive] = useState(null);
  const [bidEvents, setBidEvents] = useState([]);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [viewerHasDeposit, setViewerHasDeposit] = useState(false);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());
  const [shareStatus, setShareStatus] = useState(null);
  const pusherRef = useRef(null);
  const apiBaseRef = useRef(apiBase);
  const authTokenRef = useRef(authToken);
  const [userLeaveMeeting] = useMutation(USER_LEAVE_MEETING);
  const [meetingEnd] = useMutation(MEETING_END);

  useEffect(() => {
    apiBaseRef.current = apiBase;
  }, [apiBase]);

  useEffect(() => {
    authTokenRef.current = authToken;
  }, [authToken]);

  const rememberApiBase = useCallback((base) => {
    if (!base) return;
    if (apiBaseRef.current === base) return;
    apiBaseRef.current = base;
    setApiBase(base);
  }, []);

  /** Fast path: known apiBase first, then at most 1 fallback, 2.5s timeout each. */
  const fetchJsonPreferred = useCallback(
    async (path, options = {}) => {
      const { method = "GET", body, auth = false, preferBases } = options;
      const metaApi = readMeta(currentMeeting?.metadata || {}, "apiUrl");
      const known = apiBaseRef.current;
      const fallbacks = buildApiCandidates(metaApi, storefrontUrl);
      const candidates = uniqueBases([
        ...(preferBases || []),
        known,
        // When a working base is known, skip the long probe list.
        ...(known ? fallbacks.slice(0, 1) : fallbacks),
      ]).slice(0, known ? 2 : 3);

      let lastMessage = "Unable to reach OVCAR API";
      for (const base of candidates) {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 2500);
        try {
          const headers = {
            Accept: "application/json",
            ...(options.headers || {}),
          };
          if (body != null) {
            headers["Content-Type"] = "application/json";
          }
          if (auth) {
            const token = authTokenRef.current;
            if (!token) {
              return { ok: false, status: 401, json: { message: "Please sign in." } };
            }
            headers.Authorization = `Bearer ${token}`;
          }
          const res = await fetch(`${base}${path}`, {
            method,
            headers,
            body: body != null ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json.success !== false) {
            rememberApiBase(base);
            return { ok: true, status: res.status, json, base };
          }
          lastMessage = json.message || `Request failed (${res.status})`;
          if (res.status === 401 || res.status === 403 || res.status === 422) {
            return { ok: false, status: res.status, json: { message: lastMessage } };
          }
        } catch (_err) {
          // try next candidate
        } finally {
          window.clearTimeout(timer);
        }
      }
      return { ok: false, status: 0, json: { message: lastMessage } };
    },
    [currentMeeting, storefrontUrl, rememberApiBase],
  );

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

  // OVCar typography only inside auction layout — does not change BBB default UI,
  // OVBay, or OVFriend (separate apps / non-auction meetings).
  useEffect(() => {
    const linkId = "ovcar-auction-fonts";
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap";
      document.head.appendChild(link);
    }
    return () => {
      const existing = document.getElementById(linkId);
      if (existing) existing.remove();
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
      const type = String(data.type || "");
      const token =
        typeof data.token === "string"
          ? data.token
          : typeof data.access_token === "string"
            ? data.access_token
            : null;
      if (
        (type === "ovcar:auth" || type === "OVCAR_AUTH") &&
        token
      ) {
        persistOvcarToken(token);
        setAuthToken(token);
      }
    };

    window.addEventListener("focus", syncToken);
    document.addEventListener("visibilitychange", syncToken);
    window.addEventListener("message", onMessage);
    const pollId = window.setInterval(syncToken, 1500);
    return () => {
      window.clearInterval(pollId);
      window.removeEventListener("focus", syncToken);
      document.removeEventListener("visibilitychange", syncToken);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  // BBB loads userdata via GraphQL /userMetadata after join (not in the final URL).
  useEffect(() => {
    const fromMeta = tokenFromUserSettings(userSettings);
    if (!fromMeta) return;
    persistOvcarToken(fromMeta);
    setAuthToken(fromMeta);
  }, [userSettings]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // React-modal sets aria-hidden on #app; if it sticks after dismiss, bidding dies.
  useEffect(() => {
    const clearStuckAriaHidden = () => {
      const app = document.getElementById("app");
      if (!app || app.getAttribute("aria-hidden") !== "true") return;

      let anyOpen = false;
      document.querySelectorAll(".ReactModalPortal").forEach((portal) => {
        const overlay = portal.querySelector(".ReactModal__Overlay");
        if (!overlay) return;
        const style = window.getComputedStyle(overlay);
        if (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity || "1") > 0.05
        ) {
          anyOpen = true;
        }
      });

      if (!anyOpen) {
        app.removeAttribute("aria-hidden");
        if (app.hasAttribute("inert")) app.removeAttribute("inert");
      }
    };

    clearStuckAriaHidden();
    const timer = window.setInterval(clearStuckAriaHidden, 800);
    return () => window.clearInterval(timer);
  }, []);

  const syncRecentBids = useCallback((bids) => {
    if (!Array.isArray(bids) || bids.length === 0) return;

    const isOptimistic = (bid) =>
      !bid ||
      String(bid.id || "").startsWith("self-") ||
      String(bid.bidder_account_id || "") === "self";

    const isNumericId = (id) => /^\d+$/.test(String(id || ""));

    setBidEvents((prev) => {
      const byKey = new Map();
      prev.forEach((bid) => {
        if (bid?.id != null) byKey.set(String(bid.id), bid);
      });

      bids.forEach((raw) => {
        if (!raw) return;
        const placedAt = raw.placed_at || raw.bid_time || null;
        const id = String(
          raw.id ??
            `${raw.bidder_account_id || "x"}-${placedAt || Date.now()}`,
        );
        const ts = placedAt ? Date.parse(placedAt) : Date.now();
        byKey.set(id, {
          id,
          bidder_display:
            raw.bidder_display || raw.bidder_name || "us***",
          amount: raw.amount,
          bidder_account_id: raw.bidder_account_id,
          placed_at: placedAt,
          ts: Number.isFinite(ts) ? ts : Date.now(),
        });
      });

      // Collapse optimistic "You" + server "So***" for the same bid amount/time.
      const sorted = Array.from(byKey.values()).sort((a, b) => a.ts - b.ts);
      const collapsed = [];
      sorted.forEach((bid) => {
        const amount = Number(bid.amount);
        const idx = collapsed.findIndex((existing) => {
          if (!Number.isFinite(amount) || Number(existing.amount) !== amount) {
            return false;
          }
          return Math.abs((existing.ts || 0) - (bid.ts || 0)) < 20000;
        });

        if (idx < 0) {
          collapsed.push(bid);
          return;
        }

        const existing = collapsed[idx];
        const existingOptimistic = isOptimistic(existing);
        const bidOptimistic = isOptimistic(bid);

        if (existingOptimistic && !bidOptimistic) {
          collapsed[idx] = bid;
          return;
        }
        if (!existingOptimistic && bidOptimistic) {
          return;
        }
        if (isNumericId(bid.id) && !isNumericId(existing.id)) {
          collapsed[idx] = bid;
          return;
        }
        if (!isNumericId(bid.id) && isNumericId(existing.id)) {
          return;
        }
        collapsed[idx] = { ...existing, ...bid, ts: Math.min(existing.ts, bid.ts) };
      });

      return collapsed.slice(-40);
    });
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
    if (Array.isArray(data.recent_bids)) {
      syncRecentBids(data.recent_bids);
    }
    // Only apply deposit flag when authenticated — guest polls return false and
    // would lock bidding after unrelated UI interactions (e.g. chat).
    if (
      typeof data.viewer_has_deposit === "boolean" &&
      authTokenRef.current
    ) {
      // Once deposit is confirmed, keep it for this live session.
      if (data.viewer_has_deposit) {
        setViewerHasDeposit(true);
      }
    }
  }, [syncRecentBids]);

  const appendBidEvent = useCallback((lastBid) => {
    if (!lastBid) return;
    syncRecentBids([lastBid]);
  }, [syncRecentBids]);

  // Fetch room details once meeting metadata is ready
  useEffect(() => {
    if (!currentMeeting) return;

    const metadata = currentMeeting.metadata || {};
    const sfUrl =
      readMeta(metadata, "storefrontUrl") || OVCAR_PUBLIC_ORIGIN;
    const mId =
      readMeta(metadata, "meetingId") ||
      currentMeeting.extId ||
      currentMeeting.meetingId ||
      Auth.meetingID;
    const lId = readMeta(metadata, "listingId");

    const storefront = rewritePublicHost(sfUrl) || String(sfUrl).replace(/\/$/, "");

    setStorefrontUrl(storefront);
    setMeetingId(mId);
    if (lId) setListingId(Number(lId) || lId);

    if (!mId) return;

    let cancelled = false;
    const load = async () => {
      const result = await fetchJsonPreferred(
        `/api/livestream/${encodeURIComponent(mId)}/details`,
        { auth: Boolean(authTokenRef.current) },
      );
      if (cancelled || !result.ok) {
        if (!cancelled) {
          console.error("OVCAR livestream details failed", result.json);
        }
        return;
      }
      applyDetails(result.json.data);
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [currentMeeting, applyDetails, fetchJsonPreferred]);

  // Live price updates: poll preferred API only (+ Reverb when reachable).
  useEffect(() => {
    if (!meetingId) return undefined;

    const metadata = currentMeeting?.metadata || {};
    const reverbKey = readMeta(metadata, "reverbKey");
    let reverbHost = readMeta(metadata, "reverbHost") || "localhost";
    const reverbPort = readMeta(metadata, "reverbPort") || "8080";
    const reverbScheme = readMeta(metadata, "reverbScheme") || "http";

    if (
      (reverbHost === "localhost" ||
        reverbHost === "127.0.0.1" ||
        reverbHost === "100.125.154.13") &&
      typeof window !== "undefined"
    ) {
      const pageHost = window.location.hostname;
      if (pageHost !== "localhost" && pageHost !== "127.0.0.1") {
        reverbHost = OVCAR_PUBLIC_HOST;
      }
    }

    const handleBidPayload = (payload) => {
      if (!payload) return;
      const { last_bid: lastBid, ...liveFields } = payload;
      setAuctionLive((prev) => ({ ...(prev || {}), ...liveFields }));
      if (payload.server_time) {
        setClockOffsetMs(Date.parse(payload.server_time) - Date.now());
      }
      if (lastBid) {
        appendBidEvent(lastBid);
      }
    };

    let pollTimer = null;
    let inFlight = false;
    const pollOnce = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await fetchJsonPreferred(
          `/api/livestream/${encodeURIComponent(meetingId)}/details`,
          { auth: Boolean(authTokenRef.current) },
        );
        if (result.ok) {
          applyDetails(result.json.data);
        }
      } finally {
        inFlight = false;
      }
    };

    void pollOnce();
    pollTimer = window.setInterval(pollOnce, 2500);

    const setupPusher = () => {
      if (!window.Pusher || !reverbKey || !listingId) return;

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
      }
    };

    if (reverbKey && listingId) {
      if (!window.Pusher) {
        const script = document.createElement("script");
        script.src = "https://js.pusher.com/8.2.0/pusher.min.js";
        script.async = true;
        script.onload = setupPusher;
        document.body.appendChild(script);
      } else {
        setupPusher();
      }
    }

    return () => {
      if (pollTimer) window.clearInterval(pollTimer);
      try {
        if (pusherRef.current) {
          if (listingId) {
            pusherRef.current.unsubscribe(`auction.${listingId}`);
          }
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
    currentMeeting,
    applyDetails,
    appendBidEvent,
    fetchJsonPreferred,
  ]);

  const handleLogin = async () => {
    if (!meetingId) return;

    // Same-tab flow (more reliable than popup across BBB ↔ OVCar origins):
    // leave viewer session → login on storefront → /live/{id} rejoins with JWT in join URL.
    const livePath = `/live/${encodeURIComponent(meetingId)}`;
    const loginUrl = `${storefrontUrl}/login?redirect=${encodeURIComponent(livePath)}`;

    try {
      if (!isHost) {
        await userLeaveMeeting();
      }
    } catch (error) {
      console.error("OVCAR leave before login failed:", error);
    }

    window.setTimeout(() => {
      window.location.assign(loginUrl);
    }, 250);
  };

  const refreshAuctionDetails = useCallback(async () => {
    if (!meetingId) return;
    const result = await fetchJsonPreferred(
      `/api/livestream/${encodeURIComponent(meetingId)}/details`,
      { auth: Boolean(authTokenRef.current) },
    );
    if (result.ok) {
      applyDetails(result.json.data);
    }
  }, [meetingId, fetchJsonPreferred, applyDetails]);

  const postAuthorized = useCallback(
    async (path, body) => {
      if (!authTokenRef.current) {
        handleLogin();
        return { ok: false, json: { message: "Please sign in." } };
      }
      return fetchJsonPreferred(path, {
        method: "POST",
        body,
        auth: true,
      });
    },
    [fetchJsonPreferred],
  );

  const handleBid = async (input) => {
    if (!listingId) {
      window.alert("Auction listing is still loading. Try again in a moment.");
      return;
    }
    if (!authToken) {
      handleLogin();
      return;
    }
    if (!viewerHasDeposit) {
      window.alert(
        "Pay the auction deposit on the listing page before bidding.",
      );
      return;
    }

    const mode = input?.mode === "proxy" ? "proxy" : "instant";
    const amount =
      mode === "proxy" ? Number(input.max_amount) : Number(input.amount);
    const body =
      mode === "proxy"
        ? { mode: "proxy", max_amount: amount }
        : { mode: "instant", amount };

    setIsSubmittingBid(true);
    try {
      const result = await postAuthorized(
        `/api/listings/${listingId}/bid`,
        body,
      );
      if (!result.ok) {
        window.alert(result.json?.message || "Bid failed");
        return;
      }

      // Optimistic auction_live update — do NOT spread ListingBid into state
      // (that corrupts status / current_bid and breaks subsequent bids).
      const bidRow = result.json?.data;
      const acceptedAmount =
        Number(bidRow?.bid_amount ?? amount) || amount;
      setAuctionLive((prev) => {
        const stepRaw = Number(prev?.step_price);
        const step = Number.isFinite(stepRaw) && stepRaw > 0 ? stepRaw : 100;
        return {
          ...(prev || {}),
          current_bid: acceptedAmount,
          min_next_bid: acceptedAmount + step,
        };
      });
      appendBidEvent({
        id: bidRow?.id,
        amount: acceptedAmount,
        // Use BBB display name immediately — avoid "You" → full name flicker.
        bidder_display: currentUser?.name || "Bidder",
        bidder_account_id: bidRow?.bidder_account_id || "self",
        placed_at:
          bidRow?.bid_time ||
          bidRow?.created_at ||
          new Date().toISOString(),
      });
      void refreshAuctionDetails();
    } catch (err) {
      console.error(err);
      window.alert("Unable to place bid");
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const buildViewerShareUrl = useCallback(() => {
    if (!meetingId) return null;
    const base = String(storefrontUrl || "").replace(/\/$/, "");
    if (!base) return null;
    return `${base}/live/${encodeURIComponent(meetingId)}`;
  }, [meetingId, storefrontUrl]);

  const handleShareLive = useCallback(async () => {
    const viewerUrl = buildViewerShareUrl();
    if (!viewerUrl) {
      setShareStatus("unavailable");
      window.setTimeout(() => setShareStatus(null), 2000);
      return;
    }

    const title = listing?.title || currentMeeting?.name || "OVCAR Live";
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: "Join this live auction",
          url: viewerUrl,
        });
        setShareStatus("shared");
        window.setTimeout(() => setShareStatus(null), 2000);
        return;
      }
    } catch (err) {
      // User cancelled share sheet — do not fall through as error noise
      if (err && err.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(viewerUrl);
      setShareStatus("copied");
    } catch (_e) {
      try {
        window.prompt("Copy viewer link:", viewerUrl);
        setShareStatus("copied");
      } catch (_err) {
        setShareStatus("failed");
      }
    }
    window.setTimeout(() => setShareStatus(null), 2000);
  }, [buildViewerShareUrl, listing?.title, currentMeeting?.name]);

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

          /* Match OVCar FE fonts — scoped to auction layout only */
          #ovcar-auction-layout {
            --font-display: "Lexend", system-ui, sans-serif;
            --font-body: "Plus Jakarta Sans", system-ui, sans-serif;
            --font-nav: "Plus Jakarta Sans", system-ui, sans-serif;
            font-family: var(--font-nav), system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          #ovcar-auction-layout .ovcar-font-display {
            font-family: var(--font-display), system-ui, sans-serif;
          }
          #ovcar-auction-layout .ovcar-font-nav,
          #ovcar-auction-layout .ovcar-auction-bid-panel,
          #ovcar-auction-layout .ovcar-auction-chat,
          #ovcar-auction-layout .ovcar-auction-vehicle-card,
          #ovcar-auction-layout .ovcar-auction-share-btn {
            font-family: var(--font-nav), system-ui, sans-serif;
          }

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

          /* Keep bid/chat clickable even if a modal left aria-hidden stuck on #app. */
          #ovcar-auction-layout .ovcar-auction-left-stack,
          #ovcar-auction-layout .ovcar-auction-left-stack *,
          #ovcar-auction-layout .ovcar-auction-bid-panel,
          #ovcar-auction-layout .ovcar-auction-bid-panel *,
          #ovcar-auction-layout .ovcar-auction-chat-form,
          #ovcar-auction-layout .ovcar-auction-chat-form * {
            pointer-events: auto !important;
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
            zIndex: 80,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "stretch",
            width: isMobile ? "min(260px, calc(100% - 24px))" : "280px",
            maxWidth: isMobile ? "calc(100% - 24px)" : "280px",
            // Capture clicks in this column so chat cannot steal them.
            pointerEvents: "auto",
          }}
          onPointerDownCapture={() => {
            const active = document.activeElement;
            if (
              active &&
              active.classList?.contains("ovcar-auction-chat-input")
            ) {
              active.blur();
            }
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
              viewerHasDeposit={viewerHasDeposit}
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

        <button
          type="button"
          className="ovcar-auction-share-btn"
          onClick={handleShareLive}
          disabled={!meetingId}
          aria-label="Share"
          title="Share"
          style={{
            position: "absolute",
            bottom: isMobile ? "10px" : "24px",
            right: isMobile ? "auto" : "388px",
            left: isMobile ? "10px" : "auto",
            zIndex: 45,
            height: isMobile ? "40px" : "44px",
            minWidth: isMobile ? "40px" : "auto",
            padding: isMobile ? "0 10px" : "0 14px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.28)",
            background:
              shareStatus === "copied" || shareStatus === "shared"
                ? "rgba(16, 185, 129, 0.9)"
                : "rgba(0,0,0,0.55)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontSize: isMobile ? "12px" : "13px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            cursor: meetingId ? "pointer" : "default",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            flexShrink: 0,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            opacity: meetingId ? 1 : 0.55,
          }}
        >
          <span
            aria-hidden="true"
            style={{ fontSize: isMobile ? "14px" : "15px" }}
          >
            {shareStatus === "copied" || shareStatus === "shared" ? "✓" : "↗"}
          </span>
          {!isMobile && (
            <span>
              {shareStatus === "copied"
                ? "Copied"
                : shareStatus === "shared"
                  ? "Shared"
                  : shareStatus === "failed"
                    ? "Failed"
                    : "Share"}
            </span>
          )}
        </button>

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
              left: "50%",
              transform: "translateX(-50%)",
              bottom: isMobile ? "68px" : "24px",
              zIndex: 50,
              display: "flex",
              flexDirection: "row",
              gap: "10px",
              alignItems: "center",
              justifyContent: "center",
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
