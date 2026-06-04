import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { isEmpty } from 'radash';
import { ApolloLink, useQuery } from '@apollo/client';
import isURL from 'validator/lib/isURL';
import {
  JoinErrorCodeTable,
  MeetingEndedTable,
  openLearningDashboardUrl,
  setLearningDashboardCookie,
  allowRedirectToLogoutURL,
} from './service';
import { MeetingEndDataResponse, getMeetingEndData } from './queries';
import useAuthData from '/imports/ui/core/local-states/useAuthData';
import Icon from '/imports/ui/components/common/icon/icon-ts/component';
import Styled from './styles';
import { LoadingContext } from '../common/loading-screen/loading-screen-HOC/component';
import logger from '/imports/startup/client/logger';
import apolloContextHolder from '/imports/ui/core/graphql/apolloContextHolder/apolloContextHolder';
import useMeeting from '../../core/hooks/useMeeting';
import useCurrentUser from '../../core/hooks/useCurrentUser';

const intlMessage = defineMessages({
  410: {
    id: 'app.meeting.ended',
    description: 'message when meeting is ended',
  },
  403: {
    id: 'app.error.removed',
    description: 'Message to display when user is removed from the conference',
  },
  430: {
    id: 'app.error.meeting.ended',
    description: 'user logged conference',
  },
  'acl-not-allowed': {
    id: 'app.error.removed',
    description: 'Message to display when user is removed from the conference',
  },
  
  oneToOneEndedTitle: {
    id: 'app.oneToOneCall.endedTitle',
    description: 'message title when one-to-one call has ended',
    defaultMessage: 'Call ended',
  },
  
  oneToOneEndedMessage: {
    id: 'app.oneToOneCall.endedMessage',
    description: 'message body when one-to-one call has ended',
    defaultMessage: 'Press OK to close this call window.',
  },
  
  oneToOneRejectedTitle: {
    id: 'app.oneToOneCall.rejectedTitle',
    description: 'message title when one-to-one call is rejected before connecting',
    defaultMessage: 'Call declined',
  },
  oneToOneRejectedMessage: {
    id: 'app.oneToOneCall.rejectedMessage',
    description: 'message body when one-to-one call is rejected before connecting',
    defaultMessage: 'The other person declined the call.',
  },
  oneToOneCancelledByYouTitle: {
    id: 'app.oneToOneCall.cancelledByYouTitle',
    description: 'message title when one-to-one call is ended by current user',
    defaultMessage: 'Call ended',
  },
  oneToOneCancelledByYouMessage: {
    id: 'app.oneToOneCall.cancelledByYouMessage',
    description: 'message body when one-to-one call is ended by current user',
    defaultMessage: 'You ended the call.',
  },
  oneToOneCancelledByPeerTitle: {
    id: 'app.oneToOneCall.cancelledByPeerTitle',
    description: 'message title when the other person ends a one-to-one call before it connects',
    defaultMessage: 'Call ended',
  },
  oneToOneCancelledByPeerMessage: {
    id: 'app.oneToOneCall.cancelledByPeerMessage',
    description: 'message body when the other person ends a one-to-one call before it connects',
    defaultMessage: 'The caller ended the call while you were connecting.',
  },
  messageEnded: {
    id: 'app.meeting.endedMessage',
    description: 'default message shown when a meeting or call has ended',
  },
  messageEndedByUser: {
    id: 'app.meeting.endedByUserMessage',
    description: 'message informing who ended the meeting',
  },
  messageEndedByNoModeratorSingular: {
    id: 'app.meeting.endedByNoModeratorMessageSingular',
    description: 'message informing that the meeting was ended due to no moderator present (singular)',
  },
  messageEndedByNoModeratorPlural: {
    id: 'app.meeting.endedByNoModeratorMessagePlural',
    description: 'message informing that the meeting was ended due to no moderator present (plural)',
  },
  buttonOkay: {
    id: 'app.meeting.endNotification.ok.label',
    description: 'label okay for button',
  },
  confirmDesc: {
    id: 'app.leaveConfirmation.confirmDesc',
    description: 'adds context to confim option',
  },
  [JoinErrorCodeTable.DUPLICATE_USER]: {
    id: 'app.meeting.logout.duplicateUserEjectReason',
    description: 'message for duplicate users',
  },
  [JoinErrorCodeTable.PERMISSION_FAILED]: {
    id: 'app.meeting.logout.permissionEjectReason',
    description: 'message for whom was kicked by doing something without permission',
  },
  [JoinErrorCodeTable.EJECT_USER]: {
    id: 'app.meeting.logout.ejectedFromMeeting',
    description: 'message when the user is removed by someone',
  },
  [JoinErrorCodeTable.SYSTEM_EJECT_USER]: {
    id: 'app.meeting.logout.ejectedFromMeeting',
    description: 'message when the user is removed by the system',
  },
  [JoinErrorCodeTable.MAX_PARTICIPANTS]: {
    id: 'app.meeting.logout.maxParticipantsReached',
    description: 'message when the user is rejected due to max participants limit',
  },
  [JoinErrorCodeTable.VALIDATE_TOKEN]: {
    id: 'app.meeting.logout.validateTokenFailedEjectReason',
    description: 'invalid auth token',
  },
  [JoinErrorCodeTable.USER_INACTIVITY]: {
    id: 'app.meeting.logout.userInactivityEjectReason',
    description: 'message to whom was kicked by inactivity',
  },
  [JoinErrorCodeTable.USER_LOGGED_OUT]: {
    id: 'app.feedback.title',
    description: 'message to whom was kicked by logging out',
  },
  [JoinErrorCodeTable.BANNED_USER_REJOINING]: {
    id: 'app.error.userBanned',
    description: 'message to whom was banned',
  },
  open_activity_report_btn: {
    id: 'app.learning-dashboard.clickHereToOpen',
    description: 'description of link to open activity report',
  },
  [MeetingEndedTable.ENDED_FROM_API]: {
    id: 'app.meeting.endedFromAPI',
    description: '',
  },
  [MeetingEndedTable.ENDED_WHEN_NOT_JOINED]: {
    id: 'app.meeting.endedWhenNoUserJoined',
    description: '',
  },
  [MeetingEndedTable.ENDED_WHEN_LAST_USER_LEFT]: {
    id: 'app.meeting.endedWhenLastUserLeft',
    description: '',
  },
  [MeetingEndedTable.ENDED_AFTER_USER_LOGGED_OUT]: {
    id: 'app.meeting.endedWhenLastUserLeft',
    description: '',
  },
  [MeetingEndedTable.ENDED_AFTER_EXCEEDING_DURATION]: {
    id: 'app.meeting.endedAfterExceedingDuration',
    description: '',
  },
  [MeetingEndedTable.BREAKOUT_ENDED_EXCEEDING_DURATION]: {
    id: 'app.meeting.breakoutEndedAfterExceedingDuration',
    description: '',
  },
  [MeetingEndedTable.BREAKOUT_ENDED_BY_MOD]: {
    id: 'app.meeting.breakoutEndedByModerator',
    description: '',
  },
  [MeetingEndedTable.ENDED_DUE_TO_NO_AUTHED_USER]: {
    id: 'app.meeting.endedDueNoAuthed',
    description: '',
  },
  [MeetingEndedTable.ENDED_DUE_TO_NO_MODERATOR]: {
    id: 'app.meeting.endedDueNoModerators',
    description: '',
  },
  [MeetingEndedTable.ENDED_DUE_TO_SERVICE_INTERRUPTION]: {
    id: 'app.meeting.endedDueServiceInterruption',
    description: '',
  },
});

interface MeetingEndedContainerProps {
  endedBy: string;
  meetingEndedCode: string;
  joinErrorCode: string;
}

interface MeetingEndedProps extends MeetingEndedContainerProps {
  skipMeetingEnded: boolean;
  learningDashboardAccessToken: string;
  isModerator: boolean;
  logoutUrl: string;
  learningDashboardBase: string;
  isBreakout: boolean;
  allowRedirect: boolean;
  meetingName: string;
  meetingMetadata: Record<string, unknown>;
}

const MeetingEnded: React.FC<MeetingEndedProps> = ({
  endedBy,
  joinErrorCode,
  meetingEndedCode,
  skipMeetingEnded,
  learningDashboardAccessToken,
  isModerator,
  logoutUrl,
  learningDashboardBase,
  isBreakout,
  allowRedirect,
  meetingName,
  meetingMetadata,
}) => {
  const loadingContextInfo = useContext(LoadingContext);
  const intl = useIntl();
  const [{
    authToken,
    meetingId,
  }] = useAuthData();
  const hasStoredOneToOneContext = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage?.getItem('ovfOneToOneCallContext');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed && typeof parsed === 'object';
    } catch {
      return false;
    }
  }, []);
  const storedOneToOneContext = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage?.getItem('ovfOneToOneCallContext');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }, []);
  const popupOneToOneContext = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const rawWindowName = String(window.name || '');
      if (!rawWindowName.startsWith('ovfcall:')) return null;
      const parsed = JSON.parse(rawWindowName.slice('ovfcall:'.length));
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }, []);
  const hasPopupOneToOneContext = useMemo(() => {
    if (!popupOneToOneContext || typeof popupOneToOneContext !== 'object') return false;
    return !!(
      popupOneToOneContext.role
      || popupOneToOneContext.callerId
      || popupOneToOneContext.calleeId
      || popupOneToOneContext.peerAvatar
      || popupOneToOneContext.selfAvatar
    );
  }, [popupOneToOneContext]);
  const oneToOneEverConnected = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem('ovf_1to1_connected') === '1';
    } catch {
      return false;
    }
  }, []);
  const oneToOneEndReason = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      return (window.sessionStorage.getItem('ovf_1to1_end_reason') || '').trim();
    } catch {
      return '';
    }
  }, []);
  const persistedOneToOneFlag = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem('ovf_bbb_one_to_one') === '1';
    } catch {
      return false;
    }
  }, []);
  const oneToOneRole = useMemo(() => {
    if (typeof window === 'undefined') return '';

    const params = new URLSearchParams(window.location.search);
    const queryRole = (params.get('callRole') || params.get('call_role') || '').toLowerCase().trim();
    if (queryRole === 'caller' || queryRole === 'callee') {
      return queryRole;
    }

    const popupRole = String(popupOneToOneContext?.role || '').toLowerCase().trim();
    if (popupRole === 'caller' || popupRole === 'callee') {
      return popupRole;
    }

    const selfUserId = String(
      popupOneToOneContext?.selfUserId
      || popupOneToOneContext?.localUserId
      || storedOneToOneContext?.selfUserId
      || storedOneToOneContext?.localUserId
      || '',
    ).trim();
    const callerId = String(
      popupOneToOneContext?.callerId
      || storedOneToOneContext?.callerId
      || '',
    ).trim();
    const calleeId = String(
      popupOneToOneContext?.calleeId
      || storedOneToOneContext?.calleeId
      || '',
    ).trim();

    if (selfUserId && callerId && selfUserId === callerId) return 'caller';
    if (selfUserId && calleeId && selfUserId === calleeId) return 'callee';

    return '';
  }, [popupOneToOneContext, storedOneToOneContext]);

  const isOneToOneCall = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const mode = (params.get('mode') || '').toLowerCase();
    const layout = (params.get('layout') || '').toLowerCase();
    const { referrer = '' } = document;
    const normalizedReferrer = referrer.toLowerCase();
    const normalizedMeetingName = String(meetingName || '').toLowerCase().trim();
    const metadataRoomType = String(
      (meetingMetadata as { meta_roomType?: string; roomType?: string } | null)?.meta_roomType
      || (meetingMetadata as { meta_roomType?: string; roomType?: string } | null)?.roomType
      || '',
    ).toLowerCase().trim();
    const isOneToOneByReferrer = normalizedReferrer.includes('mode=1-1')
      || normalizedReferrer.includes('mode=one-to-one')
      || normalizedReferrer.includes('mode=one_to_one')
      || normalizedReferrer.includes('mode=1v1')
      || normalizedReferrer.includes('onetoone=true')
      || normalizedReferrer.includes('/call/join/');
    const looksLikeOneToOneByName = normalizedMeetingName.startsWith('1-1 ')
      || normalizedMeetingName.startsWith('1:1 ')
      || normalizedMeetingName.includes(' one-to-one ')
      || normalizedMeetingName.includes(' 1-1 ');
    return (
      document?.body?.classList?.contains('bbb-one-to-one-call')
      || (window as Window & { isOneToOneCall?: boolean }).isOneToOneCall === true
      || ['1-1', '1v1', 'one-to-one', 'one_to_one', 'one2one'].includes(mode)
      || ['1-1', '1v1', 'one-to-one', 'one_to_one', 'one2one'].includes(layout)
      || ['1-1', '1v1', 'one-to-one', 'one_to_one', 'one2one'].includes(metadataRoomType)
      || window.location.href.includes('oneToOne=true')
      || isOneToOneByReferrer
      || looksLikeOneToOneByName
      || persistedOneToOneFlag
      || hasPopupOneToOneContext
      || hasStoredOneToOneContext
    );
  }, [hasPopupOneToOneContext, hasStoredOneToOneContext, meetingMetadata, meetingName, persistedOneToOneFlag]);

  const normalizedEndedBy = useMemo(() => {
    const raw = String(endedBy || '').trim();
    if (!raw) return '';
    if (raw === '0' || raw === '(0)' || raw === '()' || raw.toLowerCase() === '(null)') {
      return '';
    }
    return raw;
  }, [endedBy]);

  const isOneToOneSession = isOneToOneCall || oneToOneRole === 'caller' || oneToOneRole === 'callee';
  const isMobileDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent || '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      || window.matchMedia('(max-width: 767px)').matches;
  }, []);
  const hasPopupParent = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !!(window.opener && !window.opener.closed);
    } catch {
      return false;
    }
  }, []);
  const immediateCloseTriggeredRef = useRef(false);

  const getReturnUrl = () => {
    try {
      const { referrer } = document;
      if (referrer && isURL(referrer, {
        // This option is merged with isFQDN
        // so it's not a valid ts error /validator/lib/isURL.js line 153
        // @ts-ignore
        allow_numeric_tld: true,
      })) {
        return referrer;
      }
    } catch (e) {
      // ignore and fall back to logoutUrl
    }

    return logoutUrl;
  };

  const generateEndMessage = useCallback((joinErrorCode: string, meetingEndedCode: string) => {
    if (isOneToOneSession) {
      if (oneToOneEndReason === 'cancelled_by_you') {
        return intl.formatMessage(intlMessage.oneToOneCancelledByYouTitle);
      }
      if (!oneToOneEverConnected) {
        if (oneToOneRole !== 'caller') {
          return intl.formatMessage(intlMessage.oneToOneCancelledByPeerTitle);
        }
        return intl.formatMessage(intlMessage.oneToOneRejectedTitle);
      }
      return intl.formatMessage(intlMessage.oneToOneEndedTitle);
    }
    if (!isEmpty(normalizedEndedBy)) {
      return intl.formatMessage(intlMessage.messageEndedByUser, { userName: normalizedEndedBy });
    }
    // OR opetaror always returns the first truthy value

    const code = meetingEndedCode || joinErrorCode || '410';
    return intl.formatMessage(intlMessage[code]);
  }, [intl, isOneToOneSession, oneToOneEverConnected, oneToOneEndReason, oneToOneRole, normalizedEndedBy]);

  const attemptImmediatePopupClose = useCallback(() => {
    if (typeof window === 'undefined') return false;

    try {
      window.close();
    } catch {
      // ignore
    }
    if (window.closed) return true;

    try {
      window.open('', '_self');
      window.close();
    } catch {
      // ignore
    }
    if (window.closed) return true;

    try {
      window.location.replace('about:blank');
    } catch {
      // ignore
    }

    try {
      window.close();
    } catch {
      // ignore
    }

    return window.closed;
  }, []);

  const closeMeetingWindow = useCallback((fallbackUrl: string, allowFallbackRedirect = true) => {
    if (typeof window === 'undefined') return;

    if (isMobileDevice) {
      if (window.history.length > 1) {
        window.history.back();
        window.setTimeout(() => {
          if (allowFallbackRedirect && document.visibilityState === 'visible') {
            window.location.replace(fallbackUrl);
          }
        }, 250);
        return;
      }

      if (allowFallbackRedirect) {
        window.location.replace(fallbackUrl);
      }
      return;
    }

    const finalizeCloseAttempt = () => {
      window.setTimeout(() => {
        if (window.closed) return;

        try {
          window.open('', '_self');
          window.close();
        } catch {
          // ignore
        }

        window.setTimeout(() => {
          if (window.closed) return;

          try {
            window.location.replace('about:blank');
          } catch {
            // ignore
          }

          window.setTimeout(() => {
            try {
              window.close();
            } catch {
              // ignore
            }

            if (allowFallbackRedirect && !window.closed) {
              window.location.replace(fallbackUrl);
            }
          }, 120);
        }, 120);
      }, 80);
    };

    attemptImmediatePopupClose();

    finalizeCloseAttempt();
  }, [attemptImmediatePopupClose, isMobileDevice]);

  const confirmRedirect = (isBreakout: boolean, allowRedirect: boolean, closeOnly = false) => {
    if (isBreakout) window.close();
    const baseUrl = getReturnUrl();

    if (isOneToOneSession || hasPopupParent || isMobileDevice) {
      try {
        window.sessionStorage.removeItem('ovf_bbb_one_to_one');
        window.sessionStorage.removeItem('ovf_1to1_connected');
        window.sessionStorage.removeItem('ovf_1to1_end_reason');
      } catch {
        // ignore
      }

      closeMeetingWindow(baseUrl, !closeOnly);
      return;
    }

    if (allowRedirect) {
      const reason = generateEndMessage(joinErrorCode, meetingEndedCode);
      const finalUrl = reason
        ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}reason=${encodeURIComponent(reason)}`
        : baseUrl;
      window.location.href = finalUrl;
    }
  };

  const shouldShowOkayButton = useMemo(() => (
    isOneToOneSession
    || hasPopupParent
    || isMobileDevice
    || isURL(logoutUrl, {
      // This option is merged with isFQDN
      // so it's not a valid ts error /validator/lib/isURL.js line 153
      // @ts-ignore
      allow_numeric_tld: true,
    })
  ), [hasPopupParent, isMobileDevice, isOneToOneSession, logoutUrl]);
  const shouldCloseOnlyOnOkay = isOneToOneSession || hasPopupParent || isMobileDevice;
  const handleOkayPressStart = useCallback(() => {
    if (!shouldCloseOnlyOnOkay || immediateCloseTriggeredRef.current) return;
    immediateCloseTriggeredRef.current = true;
    attemptImmediatePopupClose();
    window.setTimeout(() => {
      immediateCloseTriggeredRef.current = false;
    }, 250);
  }, [attemptImmediatePopupClose, shouldCloseOnlyOnOkay]);

  const endDescription = useMemo(() => {
    if (!isOneToOneSession) {
      return intl.formatMessage(intlMessage.messageEnded);
    }

    if (oneToOneEndReason === 'cancelled_by_you') {
      return intl.formatMessage(intlMessage.oneToOneCancelledByYouMessage);
    }

    if (!oneToOneEverConnected && oneToOneRole !== 'caller') {
      return intl.formatMessage(intlMessage.oneToOneCancelledByPeerMessage);
    }

    if (oneToOneEverConnected) {
      return intl.formatMessage(intlMessage.oneToOneEndedMessage);
    }

    return intl.formatMessage(intlMessage.oneToOneRejectedMessage);
  }, [intl, isOneToOneSession, oneToOneEndReason, oneToOneEverConnected, oneToOneRole]);

  const logoutButton = useMemo(() => {
    const { locale } = intl;

    return (
      (
        <Styled.Wrapper>
          {
            learningDashboardAccessToken && isModerator
            // Always set cookie in case Dashboard is already opened
            && setLearningDashboardCookie(learningDashboardAccessToken, meetingId, learningDashboardBase) === true
              ? (
                <>
                  <Styled.Text>
                    {intl.formatMessage(intlMessage.open_activity_report_btn)}
                  </Styled.Text>

                  <Styled.MeetingEndedButton
                    color="default"
                    onClick={() => openLearningDashboardUrl(learningDashboardAccessToken,
                      meetingId,
                      authToken,
                      learningDashboardBase,
                      locale)}
                    aria-details={intl.formatMessage(intlMessage.open_activity_report_btn)}
                  >
                    <Icon
                      iconName="multi_whiteboard"
                    />
                  </Styled.MeetingEndedButton>
                </>
              ) : null
          }
          <Styled.Text>
            {endDescription}
          </Styled.Text>
          {
            shouldShowOkayButton ? (
              <Styled.MeetingEndedButton
                color="primary"
                onMouseDown={handleOkayPressStart}
                onTouchStart={handleOkayPressStart}
                onClick={() => confirmRedirect(isBreakout, allowRedirect, shouldCloseOnlyOnOkay)}
                /* @eslint-disable-next-line */
                aria-details={intl.formatMessage(intlMessage.confirmDesc)}
                data-test="redirectButton"
              >
                {intl.formatMessage(intlMessage.buttonOkay)}
              </Styled.MeetingEndedButton>
            ) : null
          }

        </Styled.Wrapper>
      )
    );
  }, [
    allowRedirect,
    authToken,
    handleOkayPressStart,
    confirmRedirect,
    endDescription,
    intl,
    isBreakout,
    isModerator,
    learningDashboardAccessToken,
    learningDashboardBase,
    meetingId,
    shouldCloseOnlyOnOkay,
    shouldShowOkayButton,
  ]);

  useEffect(() => {
    // Sets Loading to falsed and removes loading splash screen
    loadingContextInfo.setLoading(false);
    // Stops all media tracks
    window.dispatchEvent(new Event('StopAudioTracks'));
    // get the media tag from the session storage
    // @ts-ignore
    const data = window.meetingClientSettings.public.media;
    // get media element and stops it and removes the audio source
    const mediaElement = document.querySelector<HTMLMediaElement>(data.mediaTag);
    if (mediaElement) {
      mediaElement.pause();
      mediaElement.srcObject = null;
    }
    // stops apollo client and removes it connection
    const apolloClient = apolloContextHolder.getClient();
    // stops client queries
    if (apolloClient) {
      apolloClient.stop();
    }

    apolloContextHolder.setShouldRetry(false);

    const ws = apolloContextHolder.getLink();
    // stops client connection after 5 seconds, if made immediately some data is lost
    if (ws) {
      setTimeout(() => {
        // overwrites the link with an empty link
        // if not new connection is made
        apolloClient.setLink(ApolloLink.empty());
        // closes the connection
        ws.dispose();
      }, 5000);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem('ovf_bbb_one_to_one');
      window.sessionStorage.removeItem('ovf_1to1_end_reason');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const { timeoutBeforeRedirectOnMeetingEnd } = window.meetingClientSettings.public.app;
    if (
      typeof timeoutBeforeRedirectOnMeetingEnd === 'number'
      && !skipMeetingEnded
      && (allowRedirect || isOneToOneSession)
    ) {
      setTimeout(() => {
        confirmRedirect(isBreakout, allowRedirect, isOneToOneSession);
      }, timeoutBeforeRedirectOnMeetingEnd);
    }
  }, [allowRedirect, confirmRedirect, isBreakout, isOneToOneSession, skipMeetingEnded]);

  if (skipMeetingEnded) {
    confirmRedirect(isBreakout, allowRedirect);
    return <></>; // even though well redirect, return empty component and prevent lint error
  }

  return (
    <Styled.Parent>
      <Styled.Modal data-test="meetingEndedModal">
        <Styled.Content>
          <Styled.Title>
            {generateEndMessage(joinErrorCode, meetingEndedCode, endedBy)}
          </Styled.Title>
          {(allowRedirect || isOneToOneSession) ? logoutButton : null}
        </Styled.Content>
      </Styled.Modal>
    </Styled.Parent>
  );
};

const MeetingEndedContainer: React.FC<MeetingEndedContainerProps> = ({
  endedBy,
  meetingEndedCode,
  joinErrorCode,
}) => {
  const {
    loading: meetingEndLoading,
    error: meetingEndError,
    data: meetingEndData,
  } = useQuery<MeetingEndDataResponse>(getMeetingEndData);

  const {
    data: meetingData,
  } = useMeeting((m) => ({
    isBreakout: m.isBreakout,
    name: m.name,
    metadata: m.metadata,
  }));

  const {
    data: currentUserData,
    loading: currentUserLoading,
    errors: currentUserErrors,
  } = useCurrentUser((u) => ({
    isModerator: u.isModerator,
    logoutUrl: u.logoutUrl,
  }));

  if (meetingEndLoading || !meetingEndData || currentUserLoading || !currentUserData) {
    return null;
  }

  if (meetingEndError || currentUserErrors) {
    logger.error('Error on fetching meeting end data: ', meetingEndError);
    return (
      <MeetingEnded
        endedBy=""
        joinErrorCode=""
        meetingEndedCode=""
        allowRedirect={false}
        skipMeetingEnded={false}
        learningDashboardAccessToken=""
        isModerator={false}
        logoutUrl=""
        learningDashboardBase=""
        isBreakout={false}
        meetingName=""
        meetingMetadata={{}}
      />
    );
  }

  const {
    user_current,
  } = meetingEndData;
  const {
    isModerator,
    logoutUrl,
  } = currentUserData;

  const {
    learningDashboard,
  } = user_current[0].meeting;

  const {
    skipMeetingEnded,
    learningDashboardBase,
  } = window.meetingClientSettings.public.app; 

  const allowRedirect = allowRedirectToLogoutURL(logoutUrl ?? '');

  return (
    <MeetingEnded
      endedBy={endedBy}
      joinErrorCode={joinErrorCode}
      meetingEndedCode={meetingEndedCode}
      allowRedirect={allowRedirect}
      skipMeetingEnded={skipMeetingEnded}
      learningDashboardAccessToken={learningDashboard?.learningDashboardAccessToken}
      isModerator={isModerator ?? false}
      logoutUrl={logoutUrl ?? ''}
      learningDashboardBase={learningDashboardBase}
      isBreakout={meetingData?.isBreakout ?? false}
      meetingName={String(meetingData?.name ?? '')}
      meetingMetadata={(meetingData?.metadata as Record<string, unknown> | undefined) ?? {}}
    />
  );
};

export default MeetingEndedContainer;
