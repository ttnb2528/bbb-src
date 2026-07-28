import React, { useEffect, useMemo, useState } from "react";

const formatMoney = (value) => {
  if (value == null || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const resolveMinNext = (auctionLive) => {
  if (auctionLive?.min_next_bid != null && Number.isFinite(Number(auctionLive.min_next_bid))) {
    return Number(auctionLive.min_next_bid);
  }
  if (auctionLive?.current_bid != null && Number.isFinite(Number(auctionLive.current_bid))) {
    const step = Number(auctionLive.step_price);
    const safeStep = Number.isFinite(step) && step > 0 ? step : 100;
    return Number(auctionLive.current_bid) + safeStep;
  }
  if (auctionLive?.start_price != null && Number.isFinite(Number(auctionLive.start_price))) {
    return Number(auctionLive.start_price);
  }
  return null;
};

const AuctionBidPanel = ({
  auctionLive,
  isMobile,
  isLoggedIn,
  isSubmitting,
  viewerHasDeposit,
  onBid,
  onLogin,
  serverNowMs,
}) => {
  const [mode, setMode] = useState("instant");
  const [maxBid, setMaxBid] = useState("");

  const minNext = resolveMinNext(auctionLive);
  const current = auctionLive?.current_bid != null
    ? Number(auctionLive.current_bid)
    : null;
  const startPrice = auctionLive?.start_price != null
    ? Number(auctionLive.start_price)
    : null;
  const stepRaw = Number(auctionLive?.step_price);
  const step = Number.isFinite(stepRaw) && stepRaw > 0 ? stepRaw : 100;

  const endsAtMs = auctionLive?.auction_end_time
    ? Date.parse(auctionLive.auction_end_time)
    : null;

  const status = String(auctionLive?.status || "").toUpperCase();
  const remainingMs =
    endsAtMs && serverNowMs && Number.isFinite(endsAtMs)
      ? Math.max(0, endsAtMs - serverNowMs)
      : null;
  const isEndedByTime = remainingMs != null && remainingMs <= 0;
  const hasAuctionPayload = Boolean(auctionLive && status);
  const isLive =
    hasAuctionPayload && status === "ACTIVE" && !isEndedByTime;
  const isNegotiation = status === "NEGOTIATION";
  const isLoadingAuction = !hasAuctionPayload;

  const [bidAmount, setBidAmount] = useState(minNext ?? 0);

  useEffect(() => {
    if (minNext == null) return;
    setBidAmount(minNext);
  }, [minNext]);

  const countdown = useMemo(() => {
    if (remainingMs == null) return null;
    const totalSec = Math.floor(remainingMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remainingMs]);

  const displayCurrent =
    current != null ? formatMoney(current) : formatMoney(startPrice);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      onLogin?.();
      return;
    }
    if (isSubmitting) return;
    if (!isLive) {
      window.alert(
        isLoadingAuction
          ? "Auction is still loading. Try again in a moment."
          : "Bidding is closed for this auction.",
      );
      return;
    }
    if (!viewerHasDeposit) {
      window.alert(
        "Pay the auction deposit on the listing page before bidding.",
      );
      return;
    }

    if (mode === "proxy") {
      const max = Number(maxBid);
      if (!Number.isFinite(max) || max < minNext) {
        window.alert(`Max bid must be at least ${formatMoney(minNext)}.`);
        return;
      }
      onBid?.({ mode: "proxy", max_amount: max });
      return;
    }

    if (minNext == null || !Number.isFinite(minNext)) {
      window.alert("Auction price is still loading. Try again in a moment.");
      return;
    }

    const amount = Math.max(Number(bidAmount) || 0, minNext);
    if (!Number.isFinite(amount) || amount < minNext) {
      window.alert(`Bid must be at least ${formatMoney(minNext)}.`);
      return;
    }
    onBid?.({ mode: "instant", amount });
  };

  const panelStyle = {
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    padding: "12px",
    borderRadius: "14px",
    background: "rgba(0,0,0,0.58)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "white",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    pointerEvents: "auto",
    boxSizing: "border-box",
  };

  const modeTabStyle = (active) => ({
    flex: 1,
    border: "none",
    borderRadius: "8px",
    padding: "7px 8px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    cursor: "pointer",
    color: active ? "#111" : "rgba(255,255,255,0.7)",
    background: active ? "#fff" : "transparent",
  });

  const stepperBtnStyle = {
    width: "40px",
    flexShrink: 0,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.85)",
    fontSize: "18px",
    fontWeight: 700,
    cursor: isSubmitting || !isLive ? "default" : "pointer",
    opacity: isSubmitting || !isLive ? 0.5 : 1,
  };

  const primaryBtnStyle = {
    width: "100%",
    border: "none",
    borderRadius: "10px",
    padding: "10px 12px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: isSubmitting || !isLive ? "default" : "pointer",
    color: "white",
    background: "linear-gradient(135deg, #e10600 0%, #b00000 100%)",
    opacity: isSubmitting || !isLive ? 0.7 : 1,
  };

  return (
    <div className="ovcar-auction-bid-panel" style={panelStyle}>
      <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.7 }}>
        {current != null ? "CURRENT BID" : "STARTING BID"}
      </div>
      <div
        className="ovcar-font-display"
        style={{ fontSize: "22px", fontWeight: 800, marginTop: "2px" }}
      >
        {displayCurrent}
      </div>
      <div
        style={{
          marginTop: "6px",
          fontSize: "12px",
          display: "flex",
          justifyContent: "space-between",
          gap: "8px",
          opacity: 0.85,
        }}
      >
        <span>Min next {formatMoney(minNext)}</span>
        {countdown != null ? <span>{countdown}</span> : null}
      </div>

      {!isLive ? (
        <div
          style={{
            marginTop: "12px",
            borderRadius: "10px",
            padding: "10px 12px",
            fontSize: "13px",
            fontWeight: 600,
            textAlign: "center",
            background: isNegotiation
              ? "rgba(245, 158, 11, 0.18)"
              : "rgba(255,255,255,0.08)",
            border: isNegotiation
              ? "1px solid rgba(245, 158, 11, 0.35)"
              : "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {isLoadingAuction
            ? "Loading auction…"
            : isNegotiation
              ? "Reserve not met — negotiation may be available."
              : "Auction has ended"}
        </div>
      ) : !isLoggedIn ? (
        <button
          type="button"
          onClick={() => onLogin?.()}
          style={{ ...primaryBtnStyle, marginTop: "12px" }}
        >
          Login to bid
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ marginTop: "10px" }}
        >
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "3px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.08)",
              marginBottom: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setMode("instant")}
              style={modeTabStyle(mode === "instant")}
            >
              Place bid
            </button>
            <button
              type="button"
              onClick={() => setMode("proxy")}
              style={modeTabStyle(mode === "proxy")}
            >
              Max bid
            </button>
          </div>

          {mode === "proxy" ? (
            <input
              type="number"
              min={minNext || 0}
              step={step}
              value={maxBid}
              onChange={(e) => setMaxBid(e.target.value)}
              placeholder={minNext != null ? `Min ${minNext}` : "Max amount"}
              disabled={isSubmitting}
              className="ovcar-auction-bid-input"
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                padding: "8px 10px",
                fontSize: "14px",
                outline: "none",
                marginBottom: "8px",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: "42px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.08)",
                marginBottom: "8px",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                aria-label="Decrease bid"
                disabled={isSubmitting}
                onClick={() =>
                  setBidAmount((value) =>
                    Math.max(minNext, Number(value) - step),
                  )
                }
                style={{
                  ...stepperBtnStyle,
                  borderRight: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                −
              </button>
              <div
                className="ovcar-font-display"
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: "15px",
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatMoney(Math.max(bidAmount, minNext))}
              </div>
              <button
                type="button"
                aria-label="Increase bid"
                disabled={isSubmitting}
                onClick={() =>
                  setBidAmount((value) => Number(value) + step)
                }
                style={{
                  ...stepperBtnStyle,
                  borderLeft: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                +
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            className="ovcar-auction-bid-button"
            style={primaryBtnStyle}
            onClick={handleSubmit}
          >
            {isSubmitting
              ? "Bidding…"
              : mode === "proxy"
                ? "Set max bid"
                : "Place bid"}
          </button>

          {!isMobile && (
            <div
              style={{
                marginTop: "8px",
                textAlign: "center",
                fontSize: "11px",
                opacity: 0.7,
              }}
            >
              Step {formatMoney(step)}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default AuctionBidPanel;
