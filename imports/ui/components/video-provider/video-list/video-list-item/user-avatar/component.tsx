import React from 'react';
import Styled from './styles';
import { User, VideoItem } from '/imports/ui/components/video-provider/types';

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

const UserAvatarVideo: React.FC<UserAvatarVideoProps> = (props) => {
  const {
    user, stream, unhealthyStream, squeezed, voiceUser = { talking: false },
  } = props;
  const data = { ...user, ...stream };
  const {
    name = '', color = '', avatar = '', isModerator,
  } = data;
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
      $avatarUrl={avatar}
    >
      <Styled.UserAvatarStyled
        moderator={isModerator}
        presenter={presenter}
        dialIn={clientType === 'dial-in-user'}
        color={color}
        emoji={false}
        avatar={avatar}
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
