import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useCurrentUser from '/imports/ui/core/hooks/useCurrentUser';
import useDeduplicatedSubscription from '/imports/ui/core/hooks/useDeduplicatedSubscription';
import {
  GetGuestLobbyInfo,
  getGuestLobbyInfo,
} from '/imports/ui/components/join-handler/presenceManager/queries';
import { GUEST_STATUSES } from '/imports/ui/components/join-handler/guest-wait/component';
import Styled from './styles';

const intlMessages = defineMessages({
  guestWait: {
    id: 'app.guest.guestWait',
    description: '',
  },
  firstPosition: {
    id: 'app.guest.firstPositionInWaitingQueue',
    description: '',
  },
  position: {
    id: 'app.guest.positionInWaitingQueue',
    description: '',
  },
});

const GuestWaitingNotification: React.FC = () => {
  const intl = useIntl();
  const { data: currentUserData } = useCurrentUser((u) => ({
    guestStatus: u.guestStatus,
  }));

  const { data } = useDeduplicatedSubscription<GetGuestLobbyInfo>(getGuestLobbyInfo, {
    skip: !currentUserData || currentUserData.guestStatus === 'ALLOW',
  });

  const guestStatus = currentUserData?.guestStatus;
  const guestStatusDetails = data?.user_current?.[0]?.guestStatusDetails;
  const guestLobbyMessage = guestStatusDetails?.guestLobbyMessage;
  const positionInWaitingQueue = guestStatusDetails?.positionInWaitingQueue;

  // Chỉ hiển thị khi đang chờ approval (WAIT status)
  if (guestStatus !== GUEST_STATUSES.WAIT) {
    return null;
  }

  const message = guestLobbyMessage || intl.formatMessage(intlMessages.guestWait);
  const positionMessage = positionInWaitingQueue === 1
    ? intl.formatMessage(intlMessages.firstPosition)
    : positionInWaitingQueue
      ? `${intl.formatMessage(intlMessages.position)} ${positionInWaitingQueue}`
      : '';

  return (
    <Styled.NotificationContainer>
      <Styled.Icon>
        <i className="icon-bbb-time" />
      </Styled.Icon>
      <Styled.Content>
        <Styled.Message
          aria-live="polite"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: message }}
        />
        {positionMessage && (
          <Styled.Position aria-live="polite">
            {positionMessage}
          </Styled.Position>
        )}
      </Styled.Content>
    </Styled.NotificationContainer>
  );
};

export default GuestWaitingNotification;
