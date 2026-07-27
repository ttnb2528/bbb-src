import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import { CHAT_SEND_MESSAGE } from "/imports/ui/components/chat/chat-graphql/chat-message-form/mutations";
import { CHAT_MESSAGE_FLOATING_SUBSCRIPTION } from "/imports/ui/components/chat/floating-chat/queries";
import useDeduplicatedSubscription from "/imports/ui/core/hooks/useDeduplicatedSubscription";
import { ChatMessageType } from "/imports/ui/core/enums/chat";
import ReactMarkdown from "react-markdown";
import { messageToMarkdown } from "/imports/ui/components/chat/chat-graphql/service";

const MAX_MESSAGES = 50;

const formatBidAmount = (amount) => {
  const num = Number(amount);
  if (!Number.isFinite(num)) return String(amount ?? "");
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

/**
 * Dual feed: BBB public chat + synthetic bid lines from Reverb.
 */
const AuctionChat = ({ isMobile, isHost, bidEvents = [] }) => {
  const scrollRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);

  const [sendMessage] = useMutation(CHAT_SEND_MESSAGE);

  const { data: chatMessagesHistory } = useDeduplicatedSubscription(
    CHAT_MESSAGE_FLOATING_SUBSCRIPTION,
    {
      skip: false,
      variables: { limit: MAX_MESSAGES },
    },
  );

  useEffect(() => {
    if (!chatMessagesHistory?.chat_message_public) return;

    const CHAT_CONFIG = window.meetingClientSettings?.public?.chat || {};
    const PUBLIC_GROUP_CHAT_ID =
      CHAT_CONFIG.public_group_id || "MAIN-PUBLIC-GROUP-CHAT";

    const validMessages = chatMessagesHistory.chat_message_public
      .filter((msg) => {
        const isPublicGroup = msg.chatId === PUBLIC_GROUP_CHAT_ID;
        const isSystemMsg =
          msg.messageType === ChatMessageType.USER_AWAY_STATUS_MSG ||
          msg.messageType === ChatMessageType.USER_IS_PRESENTER_MSG ||
          msg.messageType === ChatMessageType.PRESENTATION ||
          msg.messageType === ChatMessageType.CHAT_CLEAR ||
          msg.messageType === ChatMessageType.POLL;
        return isPublicGroup && !isSystemMsg;
      })
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

    setChatMessages(validMessages);
  }, [chatMessagesHistory]);

  const feedItems = useMemo(() => {
    const chatItems = chatMessages.map((msg) => ({
      key: `chat-${msg.messageId}`,
      type: "chat",
      ts: Date.parse(msg.createdAt || 0) || 0,
      msg,
    }));

    const bidItems = (bidEvents || []).map((bid) => ({
      key: `bid-${bid.id || bid.placed_at || bid.ts}`,
      type: "bid",
      ts: bid.ts || Date.parse(bid.placed_at || 0) || Date.now(),
      bid,
    }));

    return [...chatItems, ...bidItems]
      .sort((a, b) => a.ts - b.ts)
      .slice(-MAX_MESSAGES);
  }, [chatMessages, bidEvents]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;

    const onScroll = () => {
      const distanceToBottom =
        node.scrollHeight - node.scrollTop - node.clientHeight;
      isNearBottomRef.current = distanceToBottom < 80;
    };

    node.addEventListener("scroll", onScroll);
    onScroll();
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (node && isNearBottomRef.current) {
      node.scrollTop = node.scrollHeight;
    }
  }, [feedItems.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;
    setIsSending(true);

    const CHAT_CONFIG = window.meetingClientSettings?.public?.chat || {};
    const chatId = CHAT_CONFIG.public_group_id || "MAIN-PUBLIC-GROUP-CHAT";

    sendMessage({
      variables: {
        chatId,
        chatMessageInMarkdownFormat: inputValue.trim(),
      },
    })
      .then(() => setInputValue(""))
      .catch(console.error)
      .finally(() => setIsSending(false));
  };

  return (
    <div
      className="ovcar-auction-chat"
      style={{
        position: "absolute",
        bottom: isMobile ? "10px" : "24px",
        left: isMobile ? "62px" : "auto",
        right: isMobile ? "10px" : "20px",
        width: isMobile ? "auto" : "360px",
        height: isMobile ? "320px" : "55%",
        zIndex: 40,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "stretch",
      }}
    >
      <div
        ref={scrollRef}
        className="ovcar-auction-chat-scroll"
        style={{
          flex: 1,
          width: "100%",
          boxSizing: "border-box",
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          gap: "8px",
          paddingTop: "16px",
          paddingBottom: "10px",
          maskImage: "linear-gradient(to bottom, transparent, black 15%, black)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 15%, black)",
        }}
      >
        <style>{`
          .ovcar-auction-chat-scroll::-webkit-scrollbar { width: 0px; }
          .ovcar-auction-chat-scroll p { margin: 0; }
        `}</style>
        {feedItems.map((item) => {
          if (item.type === "bid") {
            const text = `${item.bid.bidder_display || "us***"} · ${formatBidAmount(item.bid.amount)}`;
            return (
              <div
                key={item.key}
                className="ovcar-auction-chat-bid"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 8px",
                  borderRadius: "10px",
                  background: "rgba(225, 6, 0, 0.22)",
                  border: "1px solid rgba(225, 6, 0, 0.35)",
                  width: "fit-content",
                  maxWidth: "100%",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#ffb4b0",
                    textShadow: "1px 1px 3px rgba(0,0,0,0.9)",
                  }}
                >
                  BID
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "white",
                    textShadow: "1px 1px 3px rgba(0,0,0,0.9)",
                  }}
                >
                  {text}
                </span>
              </div>
            );
          }

          const msg = item.msg;
          return (
            <div
              key={item.key}
              className="ovcar-auction-chat-message"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "2px 0",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #e10600 0%, #7a0000 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "12px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                }}
              >
                {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : "U"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.6)",
                    fontWeight: "bold",
                    textShadow:
                      "1px 1px 3px rgba(0,0,0,0.9), 0px 0px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  {msg.senderName || "User"}
                </span>
                <div
                  style={{
                    fontSize: "15px",
                    color: "white",
                    textShadow:
                      "1px 1px 4px rgba(0,0,0,1), 0px 0px 2px rgba(0,0,0,0.8)",
                    wordBreak: "break-word",
                    lineHeight: "1.3",
                  }}
                >
                  <ReactMarkdown
                    linkTarget="_blank"
                    allowedElements={
                      window.meetingClientSettings?.public?.chat
                        ?.allowedElements || []
                    }
                    unwrapDisallowed
                  >
                    {messageToMarkdown(msg.message || "")}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSend}
        style={{
          display: "flex",
          marginLeft: "0",
          marginRight: "0",
          maxWidth: "none",
          boxSizing: "border-box",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.2)",
          padding: "4px 12px",
          alignItems: "center",
          gap: "8px",
          minHeight: "44px",
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a comment..."
          className="ovcar-auction-chat-input"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "white",
            outline: "none",
            fontSize: "14px",
            minWidth: 0,
            padding: "8px 0",
          }}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isSending}
          style={{
            background: "transparent",
            border: "none",
            color: inputValue.trim() ? "#e10600" : "rgba(255,255,255,0.3)",
            cursor: inputValue.trim() ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            padding: "4px",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default AuctionChat;
