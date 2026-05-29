import React from 'react';
import Styled from './styles';
import { User, VideoItem } from '/imports/ui/components/video-provider/types';
import Auth from '/imports/ui/services/auth';

interface UserAvatarVideoProps {
  user: Partial<User>;
  stream: VideoItem;
  // eslint-disable-next-line react/require-default-props
  voiceUser?: {
    talking?: boolean;
  };
  squeezed: boolean;
  unhealthyStream: boolean;
}

type OneToOneCallContextWindow = Window & {
  isOneToOneCall?: boolean;
  ovOneToOneCallContext?: {
    localUserId?: string;
    localAvatar?: string;
    remoteAvatar?: string;
    avatarsByUserId?: Record<string, string>;
  };
};

const pickQueryParam = (params: URLSearchParams, keys: string[]) => {
  for (let i = 0; i < keys.length; i += 1) {
    const value = params.get(keys[i]);
    if (value) return value;
  }
  return '';
};

const normalizeAvatarUrl = (value: string) => {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const readStoredOneToOneContext = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage?.getItem('ovfOneToOneCallContext');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as {
      selfAvatar?: string;
      peerAvatar?: string;
      localAvatar?: string;
      remoteAvatar?: string;
      selfUserId?: string | number;
      localUserId?: string | number;
      callerId?: string | number;
      calleeId?: string | number;
    };
  } catch {
    return null;
  }
};

const UserAvatarVideo: React.FC<UserAvatarVideoProps> = (props) => {
  const {
    user, stream, unhealthyStream, squeezed, voiceUser = { talking: false },
  } = props;
  const data = { ...user, ...stream };
  const {
    name = '', color = '', avatar = '', isModerator,
  } = data;
  const avatarFromData = avatar
    || String((data as { avatarURL?: string }).avatarURL || '')
    || String((data as { avatarUrl?: string }).avatarUrl || '');
  let {
    presenter = false, clientType,
  } = data;

  const { talking = false } = voiceUser;
  const isOneToOneCall = (
    typeof window !== 'undefined'
    && (window as Window & { isOneToOneCall?: boolean }).isOneToOneCall === true
  )
    || (typeof document !== 'undefined'
      && document.body.classList.contains('bbb-one-to-one-call'));
  const resolvedAvatar = (() => {
    if (avatarFromData) return avatarFromData;
    if (!isOneToOneCall || typeof window === 'undefined') return '';

    const oneToOneWindow = window as OneToOneCallContextWindow;
    const userId = String((data as { userId?: string }).userId || '');
    const isLocalUser = userId && String(Auth.userID) === userId;
    const context = oneToOneWindow.ovOneToOneCallContext;
    const stored = readStoredOneToOneContext();
    const localUserIdFromStored = String(stored?.selfUserId || stored?.localUserId || '');
    const callerIdFromStored = String(stored?.callerId || '');
    const calleeIdFromStored = String(stored?.calleeId || '');
    const storedLocalAvatar = stored?.selfAvatar || stored?.localAvatar || '';
    const storedRemoteAvatar = stored?.peerAvatar || stored?.remoteAvatar || '';

    let remoteUserIdFromStored = '';
    if (localUserIdFromStored && callerIdFromStored && calleeIdFromStored) {
      remoteUserIdFromStored = localUserIdFromStored === callerIdFromStored
        ? calleeIdFromStored
        : callerIdFromStored;
    }

    const byUserId = userId ? context?.avatarsByUserId?.[userId] : '';

    if (byUserId) return normalizeAvatarUrl(byUserId);
    if (userId && localUserIdFromStored && userId === localUserIdFromStored && storedLocalAvatar) {
      return normalizeAvatarUrl(storedLocalAvatar);
    }
    if (userId && remoteUserIdFromStored && userId === remoteUserIdFromStored && storedRemoteAvatar) {
      return normalizeAvatarUrl(storedRemoteAvatar);
    }

    const queryParams = new URLSearchParams(window.location.search);
    if (isLocalUser) {
      const fromLocal = context?.localAvatar || storedLocalAvatar || pickQueryParam(queryParams, [
        'avatar',
        'selfAvatar',
        'myAvatar',
        'hostAvatar',
        'localAvatar',
      ]);
      return normalizeAvatarUrl(fromLocal || '');
    }

    const fromRemote = context?.remoteAvatar || storedRemoteAvatar || pickQueryParam(queryParams, [
      'peerAvatar',
      'remoteAvatar',
      'guestAvatar',
      'otherAvatar',
      'participantAvatar',
    ]);
    return normalizeAvatarUrl(fromRemote || '');
  })();

  const handleUserIcon = () => {
    return <>{name.toLowerCase().slice(0, 2)}</>;
  };

  // hide icons when squeezed
  if (squeezed) {
    presenter = false;
    clientType = '';
  }

  return (
    <Styled.AvatarBackdrop
      $isOneToOne={isOneToOneCall}
      $avatarUrl={resolvedAvatar}
    >
      <Styled.UserAvatarStyled
        moderator={isModerator}
        presenter={presenter}
        dialIn={clientType === 'dial-in-user'}
        color={color}
        emoji={false}
        avatar={resolvedAvatar}
        unhealthyStream={unhealthyStream}
        talking={talking}
        whiteboardAccess={undefined}
      >
        {handleUserIcon()}
      </Styled.UserAvatarStyled>
    </Styled.AvatarBackdrop>
  );
};

export default UserAvatarVideo;
