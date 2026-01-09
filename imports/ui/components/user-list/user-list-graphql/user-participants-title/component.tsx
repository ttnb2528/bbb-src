import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { USER_AGGREGATE_COUNT_SUBSCRIPTION, UsersCountSubscriptionResponse } from '/imports/ui/core/graphql/queries/users';
import UserTitleOptionsContainer from './user-options-dropdown/component';
import Styled from './styles';
import useDeduplicatedSubscription from '/imports/ui/core/hooks/useDeduplicatedSubscription';
import { USER_WITH_AUDIO_AGGREGATE_COUNT_SUBSCRIPTION, UsersWithAudioCountSubscriptionResponse } from './queries';
import useCurrentUser from '/imports/ui/core/hooks/useCurrentUser';
import useMeeting from '/imports/ui/core/hooks/useMeeting';
import { User } from '/imports/ui/Types/user';
import deviceInfo from '/imports/utils/deviceInfo';
import { layoutDispatch } from '/imports/ui/components/layout/context';
import { ACTIONS, PANELS } from '/imports/ui/components/layout/enums';
import Header from '/imports/ui/components/common/control-header/component';

interface UserTitleProps {
  count: number;
  countWithAudio: number;
  hideUserList?: boolean;
}

const messages = defineMessages({
  usersTitle: {
    id: 'app.userList.usersTitle',
    description: 'Title for the Header',
  },
  lockedUsersTitle: {
    id: 'app.userList.lockedUsersTitle',
    description: 'Title for the locked users',
  },
  closeUserListLabel: {
    id: 'app.userList.closeUserListLabel',
    description: 'Close user list button label',
    defaultMessage: 'Close',
  },
});

const UserTitle: React.FC<UserTitleProps> = ({
  count,
  countWithAudio,
  hideUserList,
}) => {
  const intl = useIntl();
  const layoutContextDispatch = layoutDispatch();
  const isMobile = deviceInfo.isMobile || deviceInfo.isPhone;
  const userListLabel = hideUserList ? messages.lockedUsersTitle : messages.usersTitle;

  // Trên mobile, hiển thị header với nút X và text "USERS (số lượng)"
  if (isMobile) {
    const userListTitle = intl.formatMessage(
      userListLabel,
      {
        userCount: count.toLocaleString('en-US', { notation: 'standard' }),
      },
    );
    return (
      <Styled.MobileHeaderWrapper isMobile={isMobile}>
        <Header
          bottomless
          data-test="userListTitle"
          leftButtonProps={{
            'aria-label': intl.formatMessage(messages.closeUserListLabel),
            'data-test': 'closeUserListSidebar',
            icon: 'close',
            hideLabel: true,
            onClick: () => {
              // Đóng sidebar khi click X
              layoutContextDispatch({
                type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
                value: false,
              });
              layoutContextDispatch({
                type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
                value: PANELS.NONE,
              });
            },
          }}
          rightButtonProps={null}
          customRightButton={
            <Styled.MobileTitle
              data-test-users-count={count}
              data-test-users-with-audio-count={countWithAudio}
            >
              {userListTitle}
            </Styled.MobileTitle>
          }
        />
      </Styled.MobileHeaderWrapper>
    );
  }

  // Desktop: hiển thị như cũ
  return (
    <Styled.Container>
      <Styled.SmallTitle>
        <span
          data-test-users-count={count}
          data-test-users-with-audio-count={countWithAudio}
        >
          {intl.formatMessage(
            userListLabel,
            {
              userCount: count.toLocaleString('en-US', { notation: 'standard' }),
            },
          )}
        </span>
      </Styled.SmallTitle>
      <UserTitleOptionsContainer />
    </Styled.Container>
  );
};

const UserTitleContainer: React.FC = () => {
  const getCountData = () => {
    const { data: countData } = useDeduplicatedSubscription<UsersCountSubscriptionResponse>(
      USER_AGGREGATE_COUNT_SUBSCRIPTION,
    );
    const count = countData?.user_aggregate?.aggregate?.count || 0;
    return count;
  };

  const {
    data: audioUsersCountData,
  } = useDeduplicatedSubscription<UsersWithAudioCountSubscriptionResponse>(
    USER_WITH_AUDIO_AGGREGATE_COUNT_SUBSCRIPTION,
  );

  const countWithAudio = audioUsersCountData?.user_aggregate?.aggregate?.count || 0;

  const { data: currentUser } = useCurrentUser((u: Partial<User>) => ({
    locked: u?.locked ?? false,
  }));

  const { data: currentMeeting } = useMeeting((m) => ({
    lockSettings: m.lockSettings,
  }));

  const hideUserList = currentUser?.locked && currentMeeting?.lockSettings?.hideUserList;

  return (
    <UserTitle
      count={getCountData() as number}
      countWithAudio={countWithAudio}
      hideUserList={hideUserList}
    />
  );
};

export default UserTitleContainer;
