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
  $isUIHidden?: boolean;
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
  transition:
    right 0.3s ease-in-out,
    transform 0.3s cubic-bezier(0.25, 1, 0.5, 1),
    opacity 0.3s ease;
  pointer-events: none;

  ${(props: any) =>
    props.$isUIHidden &&
    `
      transform: translateX(120vw) !important;
      opacity: 0;
    `}

  @media ${smallOnly} {
    right: auto !important;
    left: 50% !important;
    /* Đẩy khung chat trượt khuất ra ngoài màn hình trên mobile khi có Sidebar (User List) đang mở, hoặc khi quẹt ẩn UI */
    transform: ${(props: any) => {
      if (props.$isUIHidden) return "translateX(120vw) !important";
      if (props.$isSidebarOpen) return "translateX(-150vw) !important";
      return "translateX(-50%) !important";
    }};
    opacity: ${(props: any) =>
      props.$isUIHidden || props.$isSidebarOpen ? "0 !important" : "1"};
    width: 95vw !important;
    max-width: 400px !important;
  }

  ${(props: any) =>
    props.$hasSharedContent &&
    css`
      bottom: 90px;
      max-width: 340px;
    `}
`;

export const ChatHeader = styled.div<{ $chatState?: string }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props: any) =>
    props.$chatState !== "collapsed"
      ? "rgba(0, 0, 0, 0.4)"
      : "rgba(0, 0, 0, 0.6)"};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-sizing: border-box;
  padding: ${(props: any) =>
    props.$chatState !== "collapsed" ? "0px" : "12px"};
  border-radius: 50%;
  margin-bottom: ${(props: any) =>
    props.$chatState !== "collapsed" ? "4px" : "0"};
  color: ${(props: any) =>
    props.$chatState !== "collapsed" ? "rgba(255,255,255,0.9)" : "white"};
  cursor: pointer;
  pointer-events: auto;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  width: ${(props: any) =>
    props.$chatState !== "collapsed" ? "32px" : "48px"};
  height: ${(props: any) =>
    props.$chatState !== "collapsed" ? "32px" : "48px"};
  align-self: flex-end;

  &:hover {
    background-color: ${(props: any) =>
      props.$chatState !== "collapsed"
        ? "rgba(255,255,255,0.1)"
        : "rgba(255, 255, 255, 0.2)"};
    color: white;
  }

  i {
    font-size: ${(props: any) =>
      props.$chatState !== "collapsed" ? "1.1rem" : "1.3rem"};
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    transform: ${(props: any) =>
      props.$chatState === "expanded" ? "rotate(180deg)" : "rotate(0deg)"};
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    margin: 0;
    right: 1px;
  }
`;

export const ChatContentWrapper = styled.div<{ $chatState?: string }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: ${(props: any) => (props.$chatState !== "collapsed" ? 1 : 0)};
  transform: ${(props: any) =>
    props.$chatState !== "collapsed"
      ? "translateY(0) scale(1)"
      : "translateY(10px) scale(0.95)"};
  transform-origin: bottom right;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  pointer-events: ${(props: any) =>
    props.$chatState !== "collapsed" ? "auto" : "none"};
  max-height: ${(props: any) => {
    if (props.$chatState === "expanded") return "60vh";
    if (props.$chatState === "preview") return "120px";
    return "0px";
  }};
  overflow: ${(props: any) =>
    props.$chatState !== "collapsed" ? "visible" : "hidden"};
`;

export const MessageScrollArea = styled.div<{ $chatState?: string }>`
  flex: 1; /* Sử dụng flex 1 */
  min-height: 0; /* QUAN TRỌNG: Ngăn flex child phình ra theo nội dung, bắt buộc nó cuộn */
  overflow-y: auto;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  /* Không dùng justify-content: flex-end ở đây vì gây lỗi không scroll ngươcj lên được */
  padding-bottom: ${(props: any) =>
    props.$chatState === "preview" ? "0" : "0.5rem"};

  & > div {
    margin-top: auto; /* Đẩy xuống dưới nếu ít tin nhắn, ngược lại tự tràn và Scrollable */
  }
  /* Tạo hiệu ứng mờ dần (fade out) ở sát phía trên khi expanded */
  -webkit-mask-image: ${(props: any) =>
    props.$chatState === "preview"
      ? "none"
      : "linear-gradient(to bottom, transparent, black 15%, black 100%)"};
  mask-image: ${(props: any) =>
    props.$chatState === "preview"
      ? "none"
      : "linear-gradient(to bottom, transparent, black 15%, black 100%)"};

  /* Ẩn scrollbar để giao diện thoáng gọn chuẩn TikTok */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  cursor: ${(props: any) =>
    props.$chatState === "preview" ? "pointer" : "default"};
`;

export const FloatingMessageItem = styled.div<{ $chatState?: string }>`
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background-color: rgba(
    0,
    0,
    0,
    0.55
  ); /* Tăng opacity xíu thay vì dùng blur để tránh lỗi render webkit */
  /* Loại bỏ backdrop-filter vì khi text quá dài (mask-image), Webkit iOS/Chrome sẽ drop filter làm biến mất background */
  color: white;
  animation: ${fadeIn} 0.3s ease-out forwards;
  will-change: transform, opacity;
  display: flex;
  flex-direction: column;
  flex-shrink: 0; /* Quan trọng: Ngăn không cho Flexbox tự động bóp nhỏ các khung tin nhắn lại khi bị tràn chiều cao (overflow) */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  pointer-events: ${(props: any) =>
    props.$chatState === "preview" ? "auto" : "none"};

  /* Cài đặt gốc cho CSS transition accordion */
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  max-height: 5000px; /* Tăng max-height để tin nhắn cực dài không bị giới hạn bóng nền */
  overflow: hidden;

  /* Khi chế độ không phải expanded (tức là preview hoặc collapsed), thu gọn TẤT CẢ các tin nhắn cũ */
  ${(props: any) =>
    props.$chatState !== "expanded" &&
    css`
      &:not(:last-child) {
        opacity: 0;
        max-height: 0;
        margin-top: 0;
        padding-top: 0;
        padding-bottom: 0;
        border: none;
      }
    `}

  @media ${smallOnly} {
    padding: 1rem 0.75rem 0.2rem;
    margin-top: 0.4rem;
  }
`;

export const SenderName = styled.span`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 2px;
  /* Bỏ màu mặc định của BigBlueButton vì nó toàn màu tối (tím, xanh đậm) gây khó đọc trên nền đen mờ */
  color: rgba(255, 255, 255, 0.6);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);

  @media ${smallOnly} {
    font-size: 0.85rem;
    margin-bottom: 2px;
  }
`;

export const MessageContent = styled.div`
  font-size: 1.1rem;
  line-height: 1.3;
  word-break: break-word;
  overflow-wrap: break-word;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);

  p {
    margin: 0;
    padding: 0;
  }

  @media ${smallOnly} {
    font-size: 0.95rem;
    line-height: 1.35;
  }

  /* Cắt chuỗi nếu ở chế độ preview */
  ${(props: any) =>
    props.$chatState === "preview" &&
    css`
      display: -webkit-box;
      -webkit-line-clamp: 2; /* Chỉ hiển thị tối đa 2 dòng */
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;

      /* Cắt chìm cả p tag bên trong Markdown sinh ra */
      p {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        margin: 0;
        word-break: break-all; /* Bắt buộc bẻ chuỗi liên tục để tránh lỗi kẹt clamp */
        max-height: 2.7em; /* Ép giới hạn tuyệt đối chiều cao 2 dòng */
      }
    `}
`;

export const ChatInputForm = styled.form<{ $chatState?: string }>`
  flex-shrink: 0; /* Ngăn Input bị nghiền nát khi dòng chat quá dài */
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
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  max-height: 120px;
  overflow: hidden;

  /* Rút siêu mượt input form khi ở chế độ collapsed */
  ${(props: any) =>
    props.$chatState === "collapsed" &&
    css`
      opacity: 0;
      max-height: 0;
      margin-top: 0;
      padding-top: 0;
      padding-bottom: 0;
      border: none;
      pointer-events: none;
    `}
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
  bottom: calc(100% + 10px);
  left: 0;
  z-index: 1000;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;

  @media ${smallOnly} {
    max-height: 220px;
    overflow-y: hidden;
  }

  /* Cố gắng giới hạn các thành phần con của EmojiPicker (như emoji-mart) để không bị bung ra */
  & > * {
    @media ${smallOnly} {
      max-height: 220px !important;
    }
  }
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
