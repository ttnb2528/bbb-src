import React from "react";

const AuctionVehicleCard = ({ listing, storefrontUrl, isMobile }) => {
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

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="ovcar-auction-vehicle-card"
      style={{
        position: "absolute",
        top: isMobile ? "12px" : "20px",
        left: isMobile ? "12px" : "20px",
        zIndex: 20,
        display: "flex",
        gap: "10px",
        alignItems: "center",
        maxWidth: isMobile ? "calc(100% - 24px)" : "360px",
        padding: "10px 12px",
        borderRadius: "14px",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.18)",
        textDecoration: "none",
        color: "white",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
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
          Pinned vehicle
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
      </div>
    </a>
  );
};

export default AuctionVehicleCard;
