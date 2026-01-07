import React, { useRef, useMemo, useEffect } from 'react';
import EmojiRain from './component';
import { getEmojisToRain } from './queries';
import useDeduplicatedSubscription from '../../core/hooks/useDeduplicatedSubscription';
import useUsersBasicInfo from '../../core/hooks/useUsersBasicInfo';
import logger from '/imports/startup/client/logger';

const EmojiRainContainer = () => {
  const nowDate = useRef(new Date().toUTCString());

  const {
    data: emojisToRainData,
    loading,
    error,
  } = useDeduplicatedSubscription(getEmojisToRain, {
    variables: {
      initialCursor: nowDate.current,
    },
  });
  
  // Lấy danh sách users để map userId với name
  const usersData = useUsersBasicInfo((user) => ({
    userId: user.userId,
    name: user.name,
  }));
  
  // Tạo map userId -> name
  const usersMap = useMemo(() => {
    const map = new Map();
    if (usersData?.data) {
      usersData.data.forEach((user) => {
        if (user.userId && user.name) {
          map.set(user.userId, user.name);
        }
      });
    }
    logger.debug({
      logCode: 'emoji_rain_users_map',
      extraInfo: { usersCount: map.size },
    }, `EmojiRainContainer: Created users map with ${map.size} users`);
    return map;
  }, [usersData]);

  const emojisArray = emojisToRainData?.user_reaction_stream || [];

  const reactions = emojisArray.length === 0 ? []
    : emojisArray.map((reaction) => ({
      reaction: reaction.reactionEmoji,
      creationDate: new Date(reaction.createdAt),
      userId: reaction.userId,
      userName: usersMap.get(reaction.userId) || 'User',
    }));

  // Debug log
  useEffect(() => {
    logger.info({
      logCode: 'emoji_rain_container_data',
      extraInfo: {
        loading,
        hasError: !!error,
        emojisArrayLength: emojisArray.length,
        reactionsCount: reactions.length,
        usersMapSize: usersMap.size,
      },
    }, `EmojiRainContainer: loading=${loading}, reactions=${reactions.length}, emojisArray=${emojisArray.length}`);
    
    if (error) {
      logger.error({
        logCode: 'emoji_rain_subscription_error',
        extraInfo: { error: error.message },
      }, `EmojiRainContainer: Subscription error - ${error.message}`);
    }
    
    if (reactions.length > 0) {
      logger.debug({
        logCode: 'emoji_rain_reactions_detail',
        extraInfo: {
          reactions: reactions.map(r => ({
            emoji: r.reaction,
            userName: r.userName,
            userId: r.userId,
            createdAt: r.creationDate.toISOString(),
          })),
        },
      }, `EmojiRainContainer: Reactions details`, reactions);
    }
  }, [loading, error, emojisArray.length, reactions.length, usersMap.size]);

  return <EmojiRain reactions={reactions} />;
};

export default EmojiRainContainer;
