import styled, { keyframes, css } from "styled-components";
import { smallOnly } from "/imports/ui/stylesheets/styled-components/breakpoints";

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

export const FloatingChatContainer = styled.div<{
  $hasSharedContent?: boolean;
  $isSidebarOpen?: boolean;
  $sidebarWidth?: number;
}>`
  position: absolute;
  /* Giảm z-index xuống để các popup menu (như Options) đè lên trên khung Chat */
  z-index: 50;
  bottom: 110px;
  right: ${(props: any) =>
    props.$isSidebarOpen
      ? `calc(${props.$sidebarWidth}px + 1.5rem)`
      : "1.5rem"};
  width: 360px;
  max-width: 80vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: stretch; /* Stretch children to fill width */
  transition: right 0.3s ease-in-out;
  pointer-events: none;

  @media ${smallOnly} {
    right: auto !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 95vw !important;
    max-width: 400px !important;
  }

  @media (max-height: 500px) {
    bottom: 20px !important; /* Hạ thấp khi bật bàn phím để không bị che khuất / lơ lửng */
  }

  ${(props: any) =>
    props.$hasSharedContent &&
    css`
      bottom: 90px;
      max-width: 340px;
    `}
`;

export const ChatHeader = styled.div<{ $isExpanded?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props: any) =>
    props.$isExpanded ? "transparent" : "rgba(0, 0, 0, 0.5)"};
  backdrop-filter: ${(props: any) =>
    props.$isExpanded ? "none" : "blur(10px)"};
  -webkit-backdrop-filter: ${(props: any) =>
    props.$isExpanded ? "none" : "blur(10px)"};
  padding: ${(props: any) => (props.$isExpanded ? "4px" : "12px")};
  border-radius: 50%;
  margin-bottom: ${(props: any) => (props.$isExpanded ? "4px" : "0")};
  color: ${(props: any) =>
    props.$isExpanded ? "rgba(255,255,255,0.7)" : "white"};
  cursor: pointer;
  pointer-events: auto;
  border: 1px solid
    ${(props: any) =>
      props.$isExpanded ? "transparent" : "rgba(255, 255, 255, 0.15)"};
  box-shadow: ${(props: any) =>
    props.$isExpanded ? "none" : "0 4px 12px rgba(0, 0, 0, 0.25)"};
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  width: ${(props: any) => (props.$isExpanded ? "32px" : "48px")};
  height: ${(props: any) => (props.$isExpanded ? "32px" : "48px")};
  align-self: flex-end;

  &:hover {
    background-color: ${(props: any) =>
      props.$isExpanded ? "rgba(255,255,255,0.1)" : "rgba(255, 255, 255, 0.2)"};
    color: white;
  }

  i {
    font-size: ${(props: any) => (props.$isExpanded ? "1.1rem" : "1.3rem")};
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    transform: ${(props: any) =>
      props.$isExpanded ? "rotate(90deg)" : "rotate(0deg)"};
  }
`;

export const ChatContentWrapper = styled.div<{ $isExpanded?: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: ${(props: any) => (props.$isExpanded ? 1 : 0)};
  transform: ${(props: any) =>
    props.$isExpanded
      ? "translateY(0) scale(1)"
      : "translateY(10px) scale(0.95)"};
  transform-origin: bottom right;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  pointer-events: ${(props: any) => (props.$isExpanded ? "auto" : "none")};
  max-height: ${(props: any) => (props.$isExpanded ? "60vh" : "0px")};
  overflow: hidden;
`;

export const MessageScrollArea = styled.div`
  max-height: 40vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 0.5rem;
  /* Tạo hiệu ứng mờ dần (fade out) ở sát phía trên */
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent,
    black 15%,
    black 100%
  );
  mask-image: linear-gradient(to bottom, transparent, black 15%, black 100%);

  /* Ẩn scrollbar để giao diện thoáng gọn chuẩn TikTok */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const FloatingMessageItem = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  animation: ${fadeIn} 0.3s ease-out forwards;
  will-change: transform, opacity;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  pointer-events: none; /* Scroll và Click có thể thọc xuyên qua phần tin nhắn */
`;

export const SenderName = styled.span`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 2px;
  /* Bỏ màu mặc định của BigBlueButton vì nó toàn màu tối (tím, xanh đậm) gây khó đọc trên nền đen mờ */
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

export const MessageContent = styled.div`
  font-size: 1.1rem;
  line-height: 1.3;
  word-break: break-word;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
`;

export const ChatInputForm = styled.form`
  display: flex;
  position: relative;
  margin-top: 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 0.25rem 0.5rem;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: auto; /* Cho phép tương tác vào input */
`;

export const ChatInput = styled.textarea`
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 1.05rem;
  padding: 0.5rem 0.5rem;
  outline: none;
  resize: none;
  max-height: 120px;
  min-height: 24px;
  overflow-y: auto;
  line-height: 1.2;
  font-family: inherit;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
`;

export const EmojiPickerWrapper = styled.div`
  position: absolute;
  bottom: 110%;
  left: 0;
  z-index: 10;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
`;

export const EmojiButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

export const SendButton = styled.button`
  background: transparent;
  border: none;
  color: ${(props: any) =>
    props.disabled ? "rgba(255,255,255,0.3)" : "#4184F3"};
  cursor: ${(props: any) => (props.disabled ? "default" : "pointer")};
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const UnreadBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #ff3b30;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  border: 2px solid #1c1c1e;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;
