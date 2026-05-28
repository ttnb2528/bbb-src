import UserAvatar from '/imports/ui/components/user-avatar/component';
import {
  userIndicatorsOffset,
  mdPaddingY,
} from '/imports/ui/stylesheets/styled-components/general';
import { colorPrimary } from '/imports/ui/stylesheets/styled-components/palette';
import styled from 'styled-components';

const AvatarBackdrop = styled.div<{
  $isOneToOne: boolean;
  $avatarUrl: string;
}>`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  isolation: isolate;

  & > * {
    position: relative;
    z-index: 2;
  }

  ${({ $isOneToOne, $avatarUrl }) => $isOneToOne && $avatarUrl
    && `
    &::before {
      content: '';
      position: absolute;
      inset: -10%;
      background-image: url('${$avatarUrl}');
      background-position: center;
      background-size: cover;
      filter: blur(20px) saturate(1.1);
      opacity: 0.35;
      transform: scale(1.08);
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, rgba(3, 10, 24, 0.45) 0%, rgba(2, 8, 18, 0.65) 100%);
    }
  `}
`;

const UserAvatarStyled = styled(UserAvatar)<{
  unhealthyStream: boolean;
  dialIn: boolean;
  presenter: boolean;
}>`
  aspect-ratio: 1 / 1;
  width: auto;
  height: 60%;
  max-width: 66px;
  max-height: 66px;
  scale: 1.5;
  border-radius: 50% !important;

  ${({ unhealthyStream }) => unhealthyStream
    && `
    filter: grayscale(50%) opacity(50%);
  `}

  ${({ dialIn }) => dialIn
    && `
    &:before {
      content: "\\00a0\\e91a\\00a0";
      padding: ${mdPaddingY};
      opacity: 1;
      top: ${userIndicatorsOffset};
      right: ${userIndicatorsOffset};
      bottom: auto;
      left: auto;
      border-radius: 50%;
      background-color: ${colorPrimary};
      padding: 0.7rem !important;

      [dir="rtl"] & {
        left: auto;
        right: ${userIndicatorsOffset};
        letter-spacing: -.33rem;
      }
    }
  `}

    ${({ presenter }) => presenter
    && `
    &:before {
      padding: 0.7rem !important;
    }
  `};

  body.bbb-one-to-one-call &::before {
    display: none !important;
  }
`;

export default {
  AvatarBackdrop,
  UserAvatarStyled,
};
