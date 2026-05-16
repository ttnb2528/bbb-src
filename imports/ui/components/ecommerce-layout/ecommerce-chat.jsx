import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "@apollo/client";
import { CHAT_SEND_MESSAGE } from "/imports/ui/components/chat/chat-graphql/chat-message-form/mutations";
import { CHAT_MESSAGE_FLOATING_SUBSCRIPTION } from "/imports/ui/components/chat/floating-chat/queries";
import useDeduplicatedSubscription from "/imports/ui/core/hooks/useDeduplicatedSubscription";
import { ChatMessageType } from "/imports/ui/core/enums/chat";
import ReactMarkdown from "react-markdown";
import { messageToMarkdown } from "/imports/ui/components/chat/chat-graphql/service";

const MAX_MESSAGES = 50;

const EcommerceChat = ({ isMobile, isHost }) => {
  const scrollRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState([]);

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
    const newMessagesList = chatMessagesHistory.chat_message_public;
    const CHAT_CONFIG = window.meetingClientSettings?.public?.chat || {};
    const PUBLIC_GROUP_CHAT_ID =
      CHAT_CONFIG.public_group_id || "MAIN-PUBLIC-GROUP-CHAT";

    let validMessages = newMessagesList.filter((msg) => {
      const isPublicGroup = msg.chatId === PUBLIC_GROUP_CHAT_ID;
      const isSystemMsg =
        msg.messageType === ChatMessageType.USER_AWAY_STATUS_MSG ||
        msg.messageType === ChatMessageType.USER_IS_PRESENTER_MSG ||
        msg.messageType === ChatMessageType.PRESENTATION ||
        msg.messageType === ChatMessageType.CHAT_CLEAR ||
        msg.messageType === ChatMessageType.POLL;
      return isPublicGroup && !isSystemMsg;
    });

    validMessages.reverse();
    setVisibleMessages(validMessages);
  }, [chatMessagesHistory]);

  // Cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 1000;
    }
  }, [visibleMessages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;
    setIsSending(true);

    const CHAT_CONFIG = window.meetingClientSettings?.public?.chat || {};
    const chatId = CHAT_CONFIG.public_group_id || "MAIN-PUBLIC-GROUP-CHAT";

    sendMessage({
      variables: {
        chatId: chatId,
        chatMessageInMarkdownFormat: inputValue.trim(),
      },
    })
      .then(() => setInputValue(""))
      .catch(console.error)
      .finally(() => setIsSending(false));
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: isMobile ? "10px" : "40px",
        left: isMobile ? "10px" : "auto", // Cho phép tin nhắn trải full từ mép trái
        right: isMobile ? "10px" : isHost ? "200px" : "80px", // Tránh đè lên 3 nút của Host (Mic, Cam, Leave)
        width: isMobile ? "auto" : "340px",
        height: isMobile ? "220px" : "45%",
        zIndex: 10,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "stretch", // Ép form giãn ra
      }}
    >
      {/* Danh sách tin nhắn */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          width: "100%",
          boxSizing: "border-box",
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          paddingBottom: "10px",
          maskImage:
            "linear-gradient(to bottom, transparent, black 15%, black)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 15%, black)",
        }}
        className="ecommerce-live-chat-scroll"
      >
        <style>{`
          .ecommerce-live-chat-scroll::-webkit-scrollbar { width: 0px; }
          .ecommerce-live-chat-scroll p { margin: 0; }
        `}</style>
        {visibleMessages.map((msg) => (
          <div
            key={msg.messageId}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "2px 0",
            }}
          >
            {/* Avatar mặc định */}
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FF6B35 0%, #ff2a00 100%)",
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

            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
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
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        style={{
          display: "flex",
          marginLeft: isMobile ? "52px" : "0", // Tránh nút Giỏ hàng (44px) + gap 8px
          marginRight: isMobile ? "52px" : "0", // Tránh nút Share (44px) + gap 8px
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
          placeholder="Thêm bình luận..."
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
            color: inputValue.trim() ? "#FF6B35" : "rgba(255,255,255,0.3)",
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

export default EcommerceChat;
