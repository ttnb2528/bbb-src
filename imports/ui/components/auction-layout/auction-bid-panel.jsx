import React, { useMemo, useState } from "react";

const formatMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const AuctionBidPanel = ({
  auctionLive,
  isMobile,
  isLoggedIn,
  isSubmitting,
  onBid,
  onLogin,
  serverNowMs,
}) => {
  const [amount, setAmount] = useState("");

  const minNext = auctionLive?.min_next_bid != null
    ? Number(auctionLive.min_next_bid)
    : null;
  const current = auctionLive?.current_bid != null
    ? Number(auctionLive.current_bid)
    : null;

  const endsAtMs = auctionLive?.auction_end_time
    ? Date.parse(auctionLive.auction_end_time)
    : null;

  const countdown = useMemo(() => {
    if (!endsAtMs || !serverNowMs) return null;
    const diff = Math.max(0, endsAtMs - serverNowMs);
    const totalSec = Math.floor(diff / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [endsAtMs, serverNowMs]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onLogin?.();
      return;
    }
    const bidAmount = amount ? Number(amount) : minNext;
    if (!bidAmount || !Number.isFinite(bidAmount)) return;
    onBid?.(bidAmount);
  };

  return (
    <div
      className="ovcar-auction-bid-panel"
      style={{
        position: "absolute",
        top: isMobile ? "78px" : "96px",
        right: isMobile ? "12px" : "20px",
        zIndex: 20,
        width: isMobile ? "min(220px, calc(100% - 24px))" : "260px",
        padding: "12px",
        borderRadius: "14px",
        background: "rgba(0,0,0,0.58)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "white",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.7 }}>
        CURRENT BID
      </div>
      <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "2px" }}>
        {formatMoney(current)}
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
        {countdown ? <span>{countdown}</span> : null}
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: "10px" }}>
        <input
          type="number"
          min={minNext || 0}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={minNext != null ? String(minNext) : "Amount"}
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="ovcar-auction-bid-button"
          style={{
            width: "100%",
            border: "none",
            borderRadius: "10px",
            padding: "10px 12px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: isSubmitting ? "default" : "pointer",
            color: "white",
            background: "linear-gradient(135deg, #e10600 0%, #b00000 100%)",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {!isLoggedIn ? "Login to bid" : isSubmitting ? "Bidding…" : "Place bid"}
        </button>
      </form>
    </div>
  );
};

export default AuctionBidPanel;
