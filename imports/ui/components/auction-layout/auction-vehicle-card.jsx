import React from "react";

const formatMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const AuctionVehicleCard = ({ listing, auctionLive, storefrontUrl, isMobile }) => {
  if (!listing) return null;

  const href = listing.href
    ? `${storefrontUrl}${listing.href}`
    : `${storefrontUrl}/auctions/${listing.slug || "listing"}-${listing.id}`;

  const meta = [
    listing.brand,
    listing.manufacture_year,
    listing.odometer_value != null
      ? `${Number(listing.odometer_value).toLocaleString()} ${listing.odometer_unit || "mi"}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const currentBid = formatMoney(auctionLive?.current_bid);
  const minNext = formatMoney(auctionLive?.min_next_bid);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="ovcar-auction-vehicle-card"
      style={{
        position: "relative",
        display: "flex",
        gap: "10px",
        alignItems: "center",
        width: "100%",
        maxWidth: "100%",
        padding: "10px 12px",
        borderRadius: "14px",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.18)",
        textDecoration: "none",
        color: "white",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        pointerEvents: "auto",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: isMobile ? "56px" : "72px",
          height: isMobile ? "42px" : "54px",
          borderRadius: "8px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title || "Vehicle"}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.65)",
            marginBottom: "2px",
          }}
        >
          Auction vehicle
        </div>
        <div
          style={{
            fontSize: isMobile ? "14px" : "15px",
            fontWeight: 700,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {listing.title || `Listing #${listing.id}`}
        </div>
        {meta ? (
          <div
            style={{
              marginTop: "2px",
              fontSize: "12px",
              color: "rgba(255,255,255,0.7)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {meta}
          </div>
        ) : null}
        {currentBid ? (
          <div
            style={{
              marginTop: "6px",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              alignItems: "baseline",
              fontSize: "12px",
            }}
          >
            <span style={{ fontWeight: 800, color: "#fff" }}>
              {currentBid}
            </span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>current</span>
            {minNext ? (
              <span style={{ color: "rgba(255,255,255,0.55)" }}>
                · next {minNext}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </a>
  );
};

export default AuctionVehicleCard;
