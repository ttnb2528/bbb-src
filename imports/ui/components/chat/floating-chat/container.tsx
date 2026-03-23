import React, { useState, useEffect } from "react";
import { layoutSelectInput } from "/imports/ui/components/layout/context";
import { CHAT_MESSAGE_FLOATING_SUBSCRIPTION } from "./queries";
import FloatingChatComponent from "./component";
import useDeduplicatedSubscription from "/imports/ui/core/hooks/useDeduplicatedSubscription";
import { ChatMessageType } from "/imports/ui/core/enums/chat";

const MAX_MESSAGES = 50;

const FloatingChatContainer: React.FC = () => {
  const [visibleMessages, setVisibleMessages] = useState<any[]>([]);
  const [isUIHidden, setIsUIHidden] = useState(false);

  useEffect(() => {
    const handleSwipe = (e: any) => {
      setIsUIHidden(e.detail.hide);
    };
    window.addEventListener("swipe-ui", handleSwipe);
    return () => window.removeEventListener("swipe-ui", handleSwipe);
  }, []);

  const { data: chatMessagesHistory } = useDeduplicatedSubscription<any>(
    CHAT_MESSAGE_FLOATING_SUBSCRIPTION,
    {
      skip: false,
      variables: {
        limit: MAX_MESSAGES,
      },
    },
  );

  const hasPresentation = layoutSelectInput((i: any) => i.presentation?.isOpen);
  const hasScreenshare = layoutSelectInput(
    (i: any) => i.screenShare?.hasStream,
  );
  const isSidebarContentOpen = layoutSelectInput(
    (i: any) => i.sidebarContent?.isOpen,
  );
  const sidebarContentWidth = layoutSelectInput(
    (i: any) => i.sidebarContent?.width,
  );

  const hasSharedContent = hasPresentation || hasScreenshare;
  // Ignore sidebarNavigation to prevent the chat from getting stuck artificially on desktop
  const isSidebarOpen = isSidebarContentOpen;
  let sidebarWidth = 0;
  if (isSidebarContentOpen)
    sidebarWidth = Math.min(Math.max(sidebarContentWidth || 320, 250), 340);

  useEffect(() => {
    if (!chatMessagesHistory?.chat_message_public) return;

    const newMessagesList = chatMessagesHistory.chat_message_public;

    const CHAT_CONFIG = window.meetingClientSettings.public.chat || {};
    const PUBLIC_GROUP_CHAT_ID =
      CHAT_CONFIG.public_group_id || "MAIN-PUBLIC-GROUP-CHAT";

    let validMessages = newMessagesList.filter((msg: any) => {
      const isPublicGroup = msg.chatId === PUBLIC_GROUP_CHAT_ID;
      const isSystemMsg =
        msg.messageType === ChatMessageType.USER_AWAY_STATUS_MSG ||
        msg.messageType === ChatMessageType.USER_IS_PRESENTER_MSG ||
        msg.messageType === ChatMessageType.PRESENTATION ||
        msg.messageType === ChatMessageType.CHAT_CLEAR ||
        msg.messageType === ChatMessageType.POLL;

      return isPublicGroup && !isSystemMsg;
    });

    // Reversed because the subscription orders by desc (newest first)
    // We want chronologic order for rendering
    validMessages.reverse();

    setVisibleMessages(validMessages);
  }, [chatMessagesHistory]);

  const CURRENT_CHAT_CONFIG = window.meetingClientSettings?.public?.chat || {};
  return (
    <FloatingChatComponent
      messages={visibleMessages}
      hasSharedContent={hasSharedContent}
      chatId={CURRENT_CHAT_CONFIG.public_group_id || "MAIN-PUBLIC-GROUP-CHAT"}
      isSidebarOpen={isSidebarOpen}
      sidebarWidth={sidebarWidth}
      isUIHidden={isUIHidden}
    />
  );
};

export default FloatingChatContainer;
