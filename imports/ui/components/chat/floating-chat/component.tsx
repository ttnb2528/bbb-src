import React, { useRef, useEffect, useState } from "react";
import * as Styled from "./styles";
import { useMutation } from "@apollo/client";
import { CHAT_SEND_MESSAGE } from "../chat-graphql/chat-message-form/mutations";
import EmojiPickerComponent from "/imports/ui/components/emoji-picker/component";

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
}

const FloatingChat = ({ messages, hasSharedContent, chatId }: Props) => {
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

  return (
    <Styled.FloatingChatContainer hasSharedContent={hasSharedContent}>
      <Styled.MessageScrollArea ref={scrollRef}>
        {messages.map((msg) => (
          <Styled.FloatingMessageItem key={msg.messageId}>
            <Styled.SenderName color={msg.user?.color}>
              {msg.senderName || "User"}
            </Styled.SenderName>
            <Styled.MessageContent
              dangerouslySetInnerHTML={{ __html: msg.message }}
            />
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.01 21L23 12 2.01 3 2 10L17 12 2 14z"
              fill="currentColor"
            />
          </svg>
        </Styled.SendButton>
      </Styled.ChatInputForm>
    </Styled.FloatingChatContainer>
  );
};

export default FloatingChat;
