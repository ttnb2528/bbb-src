import React, { useRef, useEffect, useState } from "react";
import * as Styled from "./styles";
import { useMutation } from "@apollo/client";
import { CHAT_SEND_MESSAGE } from "../chat-graphql/chat-message-form/mutations";
import EmojiPickerComponent from "/imports/ui/components/emoji-picker/component";
import Icon from "/imports/ui/components/common/icon/component";
import ReactMarkdown from "react-markdown";
import { messageToMarkdown } from "/imports/ui/components/chat/chat-graphql/service";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendMessage] = useMutation(CHAT_SEND_MESSAGE);

  // Auto-scroll xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    if (!inputValue.trim()) return;
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
      .catch(console.error);
  };

  const [isExpanded, setIsExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    if (isExpanded) {
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
  }, [messages.length, isExpanded]);

  return (
    <Styled.FloatingChatContainer
      $hasSharedContent={hasSharedContent}
      $isSidebarOpen={isSidebarOpen}
      $sidebarWidth={sidebarWidth}
      $isUIHidden={isUIHidden}
    >
      <Styled.ChatHeader
        onClick={() => setIsExpanded(!isExpanded)}
        $isExpanded={isExpanded}
        title={isExpanded ? "Thu gọn chat" : "Hiển thị chat"}
      >
        <Icon iconName={isExpanded ? "up_arrow" : "group_chat"} />
        {!isExpanded && unreadCount > 0 && (
          <Styled.UnreadBadge>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Styled.UnreadBadge>
        )}
      </Styled.ChatHeader>

      <Styled.ChatContentWrapper $isExpanded={isExpanded}>
        <Styled.MessageScrollArea ref={scrollRef}>
          {messages.map((msg) => (
            <Styled.FloatingMessageItem key={msg.messageId}>
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
        </Styled.MessageScrollArea>

        <Styled.ChatInputForm onSubmit={handleSend}>
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
            placeholder="Gửi lên Chat công khai..."
          />
          <Styled.SendButton type="submit" disabled={!inputValue.trim()}>
            <Icon iconName="send" />
          </Styled.SendButton>
        </Styled.ChatInputForm>
      </Styled.ChatContentWrapper>
    </Styled.FloatingChatContainer>
  );
};

export default FloatingChat;
