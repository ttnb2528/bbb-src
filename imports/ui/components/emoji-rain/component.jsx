import React, { useRef, useState, useEffect } from 'react';
import { getSettingsSingletonInstance } from '/imports/ui/services/settings';
import Service from './service';
import logger from '/imports/startup/client/logger';

const EmojiRain = ({ reactions }) => {
  const Settings = getSettingsSingletonInstance();
  const containerRef = useRef(null);
  const processedReactionsRef = useRef(new Set());
  const lastEmojiTimeRef = useRef(0);
  const activeEmojisCountRef = useRef(0);
  const [isAnimating, setIsAnimating] = useState(true); // Khởi tạo là true thay vì false
  const EMOJI_SIZE = window.meetingClientSettings.public.app.emojiRain?.emojiSize || 1;
  const NUMBER_OF_EMOJIS = window.meetingClientSettings.public.app.emojiRain?.numberOfEmojis || 3;
  // Force enable emoji rain để tính năng luôn hoạt động
  const EMOJI_RAIN_ENABLED = window.meetingClientSettings.public.app.emojiRain?.enabled ?? true;

  const { animations } = Settings.application;

  // Giới hạn: mỗi 300ms mới cho phép 1 emoji bay lên, tối đa 5 emoji trên màn hình cùng lúc
  const EMOJI_THROTTLE_MS = 300;
  const MAX_ACTIVE_EMOJIS = 5;
  const MAX_EMOJIS_PER_REACTION = 1; // Mỗi reaction chỉ tạo 1 emoji thay vì 3

  // Debug log settings
  useEffect(() => {
    logger.info({
      logCode: 'emoji_rain_settings',
      extraInfo: {
        EMOJI_RAIN_ENABLED,
        animations,
        EMOJI_SIZE,
        NUMBER_OF_EMOJIS,
        containerRefExists: !!containerRef.current,
      },
    }, `EmojiRain settings: enabled=${EMOJI_RAIN_ENABLED}, animations=${animations}`);
  }, [EMOJI_RAIN_ENABLED, animations]);

  function createEmojiRain(emoji, userName) {
    if (!containerRef.current) {
      logger.warn({
        logCode: 'emoji_rain_no_container',
      }, 'EmojiRain: containerRef.current is null, cannot create animation');
      return;
    }

    // Throttle: kiểm tra thời gian từ lần cuối
    const now = Date.now();
    if (now - lastEmojiTimeRef.current < EMOJI_THROTTLE_MS) {
      logger.debug({
        logCode: 'emoji_rain_throttled',
        extraInfo: { timeSinceLast: now - lastEmojiTimeRef.current },
      }, `EmojiRain: Throttled - too soon since last emoji`);
      return;
    }

    // Giới hạn số lượng emoji đang active
    if (activeEmojisCountRef.current >= MAX_ACTIVE_EMOJIS) {
      logger.debug({
        logCode: 'emoji_rain_max_reached',
        extraInfo: { activeCount: activeEmojisCountRef.current },
      }, `EmojiRain: Max active emojis reached (${activeEmojisCountRef.current})`);
      return;
    }
    
    logger.info({
      logCode: 'emoji_rain_creating',
      extraInfo: { emoji, userName, activeCount: activeEmojisCountRef.current },
    }, `EmojiRain: Creating animation for emoji=${emoji}, userName=${userName}`);
    
    // Update last emoji time
    lastEmojiTimeRef.current = now;
    activeEmojisCountRef.current += 1;
    
    const flyingEmojis = [];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Chỉ tạo 1 emoji mỗi reaction để tránh quá tải
    const numEmojis = MAX_EMOJIS_PER_REACTION;
    
    logger.debug({
      logCode: 'emoji_rain_params',
      extraInfo: { numEmojis, viewportWidth, viewportHeight },
    }, `EmojiRain: Creating ${numEmojis} emojis`);

    for (let i = 0; i < numEmojis; i++) {
      // Vị trí bắt đầu: ngẫu nhiên ở dưới màn hình
      const startX = Math.random() * viewportWidth;
      const startY = viewportHeight + 50; // Bắt đầu từ dưới màn hình
      
      // Vị trí kết thúc: ngẫu nhiên ở trên màn hình
      const endX = startX + (Math.random() - 0.5) * 200; // Di chuyển ngang một chút
      const endY = Math.random() * (viewportHeight * 0.4); // Bay lên trên 40% màn hình
      
      // Thời gian animation: 2-4 giây
      const duration = Math.random() * 2000 + 2000;
      
      // Tạo container cho emoji và tên
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = `${startX}px`;
      container.style.top = `${startY}px`;
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '10000';
      container.style.willChange = 'transform, opacity';
      container.style.opacity = '0';
      container.style.transform = 'translateY(0) scale(1)';
      
      // Tạo emoji element - giảm kích thước xuống
      const emojiElement = document.createElement('div');
      emojiElement.style.fontSize = `${EMOJI_SIZE * 1.2}em`; // Giảm từ 2em xuống 1.2em
      emojiElement.style.lineHeight = '1';
      emojiElement.textContent = emoji;
      
      // Tạo tên người gửi - cũng giảm kích thước
      const nameElement = document.createElement('div');
      nameElement.style.fontSize = '0.6rem'; // Giảm từ 0.65rem xuống 0.6rem
      nameElement.style.color = '#ffffff';
      nameElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      nameElement.style.padding = '2px 6px'; // Giảm padding từ 4px 10px xuống 2px 6px
      nameElement.style.borderRadius = '10px'; // Giảm border radius
      nameElement.style.marginTop = '4px'; // Giảm margin từ 6px xuống 4px
      nameElement.style.whiteSpace = 'nowrap';
      nameElement.style.fontWeight = '500';
      nameElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      nameElement.textContent = userName;
      
      container.appendChild(emojiElement);
      container.appendChild(nameElement);
      containerRef.current.appendChild(container);
      
      flyingEmojis.push({ container, endX, endY, duration });
    }

    // Force reflow để đảm bảo browser nhận biết initial state
    if (containerRef.current) {
      void containerRef.current.offsetHeight;
    }
    
    logger.debug({
      logCode: 'emoji_rain_triggering',
      extraInfo: { count: flyingEmojis.length },
    }, `EmojiRain: Triggering animation for ${flyingEmojis.length} emojis`);
    
    // Trigger animation sau một frame để đảm bảo DOM đã update
    setTimeout(() => {
      flyingEmojis.forEach(({ container, endX, endY, duration }) => {
        container.style.transition = `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
        container.style.left = `${endX}px`;
        container.style.top = `${endY}px`;
        container.style.opacity = '1';
        container.style.transform = 'translateY(-30px) scale(1.1)';
      });
      logger.debug({
        logCode: 'emoji_rain_animated',
        extraInfo: { count: flyingEmojis.length },
      }, `EmojiRain: Animation triggered for ${flyingEmojis.length} emojis`);
    }, 16); // ~1 frame delay

    // Cleanup sau khi animation xong
    const maxDuration = Math.max(...flyingEmojis.map(e => e.duration));
    setTimeout(() => {
      flyingEmojis.forEach(({ container }) => {
        container.style.opacity = '0';
        container.style.transform += ' scale(0.8)';
        setTimeout(() => {
          if (container.parentNode) {
            container.remove();
          }
          // Giảm active count khi emoji được remove
          activeEmojisCountRef.current = Math.max(0, activeEmojisCountRef.current - 1);
        }, 300);
      });
    }, maxDuration);
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      setIsAnimating(false);
    } else if (animations) {
      // Force enable khi tab được focus lại
      setIsAnimating(true);
    }
  };

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Đảm bảo animation được bật ngay khi component mount
    if (animations !== false && !document.hidden) {
      setIsAnimating(true);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [animations]);

  useEffect(() => {
    // Luôn bật animation nếu animations setting cho phép (bỏ qua EMOJI_RAIN_ENABLED check)
    // Force enable animation ngay khi component mount và animations setting được bật
    if (animations !== undefined) {
      const shouldAnimate = animations && !document.hidden;
      logger.debug({
        logCode: 'emoji_rain_animation_state',
        extraInfo: { shouldAnimate, EMOJI_RAIN_ENABLED, animations, documentHidden: document.hidden },
      }, `EmojiRain: Setting animation state to ${shouldAnimate} (EMOJI_RAIN_ENABLED=${EMOJI_RAIN_ENABLED})`);
      
      setIsAnimating(shouldAnimate);
    } else {
      // Nếu animations chưa được load, set default là true
      setIsAnimating(true);
    }
  }, [animations]);

  useEffect(() => {
    logger.debug({
      logCode: 'emoji_rain_reactions_check',
      extraInfo: {
        isAnimating,
        containerExists: !!containerRef.current,
        EMOJI_RAIN_ENABLED,
        animations,
        reactionsCount: reactions.length,
      },
    }, `EmojiRain: Checking reactions - isAnimating=${isAnimating}, reactions=${reactions.length}`);
    
    if (!isAnimating || !containerRef.current || !animations) {
      if (!isAnimating) {
        logger.debug({ logCode: 'emoji_rain_not_animating' }, 'EmojiRain: Not animating, skipping');
      }
      if (!containerRef.current) {
        logger.warn({ logCode: 'emoji_rain_no_container_ref' }, 'EmojiRain: containerRef.current is null');
      }
      if (!animations) {
        logger.debug({ logCode: 'emoji_rain_animations_disabled' }, 'EmojiRain: Animations setting is disabled');
      }
      return;
    }

    reactions.forEach((reaction, index) => {
      // Tạo unique key cho reaction để track đã xử lý chưa
      const reactionKey = `${reaction.userId}-${reaction.creationDate.getTime()}-${reaction.reaction}`;
      
      // Skip nếu đã xử lý
      if (processedReactionsRef.current.has(reactionKey)) {
        logger.debug({
          logCode: 'emoji_rain_already_processed',
          extraInfo: { reactionKey, index },
        }, `EmojiRain: Reaction ${index} already processed, skipping`);
        return;
      }

      // Chỉ xử lý reactions mới và không phải 'none'
      if (reaction.reaction && reaction.reaction !== 'none') {
        const currentTime = new Date().getTime();
        const secondsSinceCreated = (currentTime - reaction.creationDate.getTime()) / 1000;
        
        logger.debug({
          logCode: 'emoji_rain_reaction_check',
          extraInfo: {
            index,
            reaction: reaction.reaction,
            userName: reaction.userName,
            secondsSinceCreated,
            reactionKey,
          },
        }, `EmojiRain: Checking reaction ${index} - emoji=${reaction.reaction}, secondsSinceCreated=${secondsSinceCreated.toFixed(2)}`);
        
        // Xử lý reactions trong vòng 10 giây (để đảm bảo catch được)
        if (secondsSinceCreated <= 10 && secondsSinceCreated >= -1) {
          processedReactionsRef.current.add(reactionKey);
          createEmojiRain(reaction.reaction, reaction.userName || 'User');
          
          // Cleanup old processed reactions sau 15 giây
          setTimeout(() => {
            processedReactionsRef.current.delete(reactionKey);
          }, 15000);
        } else {
          logger.debug({
            logCode: 'emoji_rain_reaction_too_old',
            extraInfo: { secondsSinceCreated },
          }, `EmojiRain: Reaction too old (${secondsSinceCreated.toFixed(2)}s), skipping`);
        }
      } else {
        logger.debug({
          logCode: 'emoji_rain_reaction_none',
          extraInfo: { reaction: reaction.reaction },
        }, `EmojiRain: Reaction is 'none' or empty, skipping`);
      }
    });
  }, [isAnimating, reactions, EMOJI_RAIN_ENABLED, animations]);

  // Đảm bảo animation được bật khi container được mount
  useEffect(() => {
    if (containerRef.current && animations !== false && !document.hidden) {
      setIsAnimating(true);
      logger.debug({
        logCode: 'emoji_rain_container_mounted',
        extraInfo: { animations, containerExists: !!containerRef.current },
      }, 'EmojiRain: Container mounted, enabling animation');
    }
  }, [animations]);

  const containerStyle = {
    width: '100vw',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 9999,
  };

  return <div ref={containerRef} style={containerStyle} data-test="emojiRain" />;
};

export default EmojiRain;
