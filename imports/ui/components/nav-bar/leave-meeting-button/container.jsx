import React from 'react';
import { useMutation, useReactiveVar } from '@apollo/client';
import LeaveMeetingButton from './component';
import { layoutSelect } from '../../layout/context';
import { USER_LEAVE_MEETING } from '/imports/ui/core/graphql/mutations/userMutations';
import { MEETING_END } from '/imports/ui/components/end-meeting-confirmation/mutations';
import { useStorageKey } from '/imports/ui/services/storage/hooks';
import useCurrentUser from '/imports/ui/core/hooks/useCurrentUser';
import connectionStatus from '/imports/ui/core/graphql/singletons/connectionStatus';
import useMeeting from '/imports/ui/core/hooks/useMeeting';
import deviceInfo from '/imports/utils/deviceInfo';
import { useShortcut } from '/imports/ui/core/hooks/useShortcut';

const LeaveMeetingButtonContainer = (props) => {
  const {
    data: currentUser,
  } = useCurrentUser((u) => ({
    isModerator: u.isModerator,
  }));

  const {
    data: meeting,
  } = useMeeting((m) => ({
    isBreakout: m.isBreakout,
  }));

  const { isMobile } = deviceInfo;
  const isRTL = layoutSelect((i) => i.isRTL);
  const [userLeaveMeeting] = useMutation(USER_LEAVE_MEETING);
  const [meetingEnd] = useMutation(MEETING_END);
  const isDropdownOpen = useStorageKey('dropdownOpen');

  const openLeaveMenu = useShortcut('openLeaveMenu');

  const connected = useReactiveVar(connectionStatus.getConnectedStatusVar());
  const amIModerator = currentUser?.isModerator;
  const isBreakoutRoom = meeting?.isBreakout;
  return (
    <LeaveMeetingButton {...
      {
        ismobile: isMobile,
        isRTL,
        userLeaveMeeting,
        meetingEnd,
        isDropdownOpen,
        amIModerator,
        connected,
        isBreakoutRoom,
        openLeaveMenu,
        ...props,
      }
    }
    />
  );
};

export default LeaveMeetingButtonContainer;
