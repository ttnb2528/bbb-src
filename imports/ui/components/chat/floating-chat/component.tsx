import React, { useRef, useEffect, useState } from "react";
import * as Styled from "./styles";
import { useMutation } from "@apollo/client";
import { CHAT_SEND_MESSAGE } from "../chat-graphql/chat-message-form/mutations";
import EmojiPickerComponent from "/imports/ui/components/emoji-picker/component";
import Icon from "/imports/ui/components/common/icon/component";
import ReactMarkdown from "react-markdown";
import { messageToMarkdown } from "/imports/ui/components/chat/chat-graphql/service";
import { defineMessages, useIntl } from "react-intl";

const intlMessages = defineMessages({
  publicChatPlaceholder: {
    id: "app.chat.inputPlaceholder",
    defaultMessage: "Message {chatName}...",
  },
  publicChatName: {
    id: "app.chat.titlePublic",
    defaultMessage: "Public Chat",
  },
  collapseChat: {
    id: "app.chat.collapse",
    defaultMessage: "Collapse chat",
  },
  expandChat: {
    id: "app.chat.expand",
    defaultMessage: "Expand chat",
  },
});

interface Message {
  messageSequence: number;
  messageId: string;
  message: string;
  senderName: string;
  user?: {
    color?: string;
  };
}

interface Props {
  messages: Message[];
  hasSharedContent: boolean;
  chatId: string;
  isSidebarOpen?: boolean;
  sidebarWidth?: number;
  isUIHidden?: boolean;
}

const FloatingChat = ({
  messages,
  hasSharedContent,
  chatId,
  isSidebarOpen,
  sidebarWidth,
  isUIHidden,
}: Props) => {
  const intl = useIntl();
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendMessage] = useMutation(CHAT_SEND_MESSAGE);

  // Auto-scroll xuống dưới cùng bằng ResizeObserver: bắt dính mọi biến đổi Height
  useEffect(() => {
    if (chatState === "expanded") {
      const el = innerScrollRef.current;
      if (!el) return;

      const observer = new ResizeObserver(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 1000;
        }
      });
      // Observe the inner wrapper to catch the accordion max-height transitions
      observer.observe(el);

      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 1000;
      }

      return () => observer.disconnect();
    }
  }, [chatState]);

  // Cuộn thẳng xuống khi có tin nhắn mới nếu đang Expand
  useEffect(() => {
    if (chatState === "expanded" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 1000;
    }
  }, [messages.length]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  const handleEmojiSelect = (emojiObject: { native: string }) => {
    setInputValue((prev: string) => prev + emojiObject.native);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;
    setIsSending(true);
    sendMessage({
      variables: {
        chatId: chatId,
        chatMessageInMarkdownFormat: inputValue.trim(),
      },
    })
      .then(() => {
        setInputValue("");
        resetTextareaHeight();
        setShowEmojiPicker(false);
      })
      .catch(console.error)
      .finally(() => setIsSending(false));
  };

  type ChatMode = "expanded" | "preview" | "collapsed";
  const [chatState, setChatState] = useState<ChatMode>("expanded");
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    if (chatState === "expanded") {
      setUnreadCount(0);
    } else {
      if (messages.length > prevMessagesLength.current) {
        // Only increment if new messages are appended
        setUnreadCount(
          (prev: number) =>
            prev + (messages.length - prevMessagesLength.current),
        );
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, chatState]);

  const toggleChatState = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (chatState === "expanded") setChatState("preview");
    else if (chatState === "preview") setChatState("collapsed");
    else setChatState("expanded");
  };

  const getHeaderIcon = () => {
    if (chatState === "expanded") return "up_arrow";
    if (chatState === "preview") return "minus"; // Chuyển sang thu gọn hẳn
    return "group_chat";
  };

  const getHeaderTitle = () => {
    if (chatState === "expanded")
      return intl.formatMessage(intlMessages.collapseChat);
    if (chatState === "preview") return "Collapse chat fully";
    return intl.formatMessage(intlMessages.expandChat);
  };
  return (
    <Styled.FloatingChatContainer
      $hasSharedContent={hasSharedContent}
      $isSidebarOpen={isSidebarOpen}
      $sidebarWidth={sidebarWidth}
      $isUIHidden={isUIHidden}
    >
      <Styled.ChatHeader
        onClick={toggleChatState}
        onTouchEnd={(e) => {
          // Prevent ghost clicks on iOS from interacting with elements behind this button
          e.preventDefault();
          toggleChatState(e);
        }}
        $chatState={chatState}
        title={getHeaderTitle()}
      >
        <Icon iconName={getHeaderIcon()} />
        {chatState === "collapsed" && unreadCount > 0 && (
          <Styled.UnreadBadge>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Styled.UnreadBadge>
        )}
      </Styled.ChatHeader>

      <Styled.ChatContentWrapper $chatState={chatState}>
        <Styled.MessageScrollArea ref={scrollRef} $chatState={chatState}>
          <div ref={innerScrollRef}>
            {messages.map((msg) => (
              <Styled.FloatingMessageItem
                key={msg.messageId}
                $chatState={chatState}
              >
                <Styled.SenderName color={msg.user?.color}>
                  {msg.senderName || "User"}
                </Styled.SenderName>
                <Styled.MessageContent>
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
                </Styled.MessageContent>
              </Styled.FloatingMessageItem>
            ))}
          </div>
        </Styled.MessageScrollArea>

        <Styled.ChatInputForm onSubmit={handleSend} $chatState={chatState}>
          {showEmojiPicker && (
            <Styled.EmojiPickerWrapper>
              <EmojiPickerComponent onEmojiSelect={handleEmojiSelect} />
            </Styled.EmojiPickerWrapper>
          )}
          <Styled.EmojiButton
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😀
          </Styled.EmojiButton>
          <Styled.ChatInput
            ref={textareaRef}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={intl.formatMessage(
              intlMessages.publicChatPlaceholder,
              { chatName: intl.formatMessage(intlMessages.publicChatName) },
            )}
          />
          <Styled.SendButton
            type="submit"
            disabled={!inputValue.trim() || isSending}
          >
            <Icon iconName="send" />
          </Styled.SendButton>
        </Styled.ChatInputForm>
      </Styled.ChatContentWrapper>
    </Styled.FloatingChatContainer>
  );
};

export default FloatingChat;
