import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import useMeeting from '/imports/ui/core/hooks/useMeeting';
import useCurrentUser from '/imports/ui/core/hooks/useCurrentUser';
import ModalSimple from '/imports/ui/components/common/modal/simple/component';
import { useQuery } from '@apollo/client';
import { GET_WELCOME_MESSAGE, WelcomeMsgsResponse } from './queries';
import Styled from './styles';
import deviceInfo from '/imports/utils/deviceInfo';

const intlMessages = defineMessages({
  title: {
    id: 'app.sessionDetails.title',
    description: 'Session details title',
  },
  dismissLabel: {
    id: 'app.sessionDetails.dismissLabel',
    description: 'Dismiss button label',
  },
  dismissDesc: {
    id: 'app.sessionDetails.dismissDesc',
    description: 'adds descriptive context to dissmissLabel',
  },
  joinByUrlLabel: {
    id: 'app.sessionDetails.joinByUrl',
    description: 'adds descriptive context to dissmissLabel',
  },
  joinByPhoneLabel: {
    id: 'app.sessionDetails.joinByPhone',
    description: 'adds descriptive context to dissmissLabel',
  },
  copyUrlTooltip: {
    id: 'app.sessionDetails.copyUrlTooltip',
    description: 'adds descriptive context to dissmissLabel',
  },
  copyPhoneTooltip: {
    id: 'app.sessionDetails.copyPhoneTooltip',
    description: 'adds descriptive context to dissmissLabel',
  },
  phonePinLabel: {
    id: 'app.sessionDetails.phonePin',
    description: 'adds descriptive context to dissmissLabel',
  },
  copied: {
    id: 'app.sessionDetails.copied',
    description: 'Copied join data',
  },
});

interface SessionDetailsContainerProps {
  isOpen: boolean,
  onRequestClose: () => void,
  priority: string,
}

interface SessionDetailsProps extends SessionDetailsContainerProps {
  welcomeMessage: string;
  welcomeMsgForModerators: string;
  loginUrl: string,
  formattedDialNum: string,
  formattedTelVoice: string,
  anchorElement: HTMLElement | null,
  meetingId: string;
}

const COPY_MESSAGE_TIMEOUT = 3000;

const SessionDetails: React.FC<SessionDetailsProps> = (props) => {
  const {
    welcomeMessage,
    welcomeMsgForModerators,
    isOpen,
    onRequestClose,
    priority,
    loginUrl,
    formattedDialNum,
    formattedTelVoice,
    anchorElement,
    meetingId,
  } = props;
  const intl = useIntl();
  const [copyingJoinUrl, setCopyingJoinUrl] = useState(false);
  const [copyingDialIn, setCopyingDialIn] = useState(false);
  const [copyingInviteLink, setCopyingInviteLink] = useState(false);

  const formattedPin = formattedTelVoice.replace(/(?=(\d{3})+(?!\d))/g, ' ');

  // Read external invite link passed from WordPress plugin (or other integrators)
  // Example: https://ovvideo.com/html5client/?sessionToken=...&externalInvite=<encoded-join-page-url>
  const getExternalInviteLink = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('externalInvite');
      if (!raw) return null;
      return decodeURIComponent(raw);
    } catch (e) {
      return null;
    }
  };

  const externalInviteLink = getExternalInviteLink();

  // Build invite link from meetingId (fallback if externalInvite is not available)
  // This works for WordPress plugin join pages: https://ovfriends.com/join-meeting/?mid=<meetingId>
  const buildInviteLinkFromMeetingId = (): string | null => {
    if (!meetingId) return null;
    
    // Get base URL from settings or use default
    const baseUrl = (typeof window !== 'undefined')
      // @ts-ignore - brrJoinBaseUrl may be added by backend
      ? (window?.meetingClientSettings?.public?.app?.brrJoinBaseUrl || 'https://ovfriends.com/join-meeting/?mid=')
      : 'https://ovfriends.com/join-meeting/?mid=';
    
    // If baseUrl already contains ?mid=, just append meetingId (already encoded)
    if (baseUrl.includes('?mid=')) {
      return `${baseUrl}${encodeURIComponent(meetingId)}`;
    }
    
    // If baseUrl is a full URL, append ?mid= parameter
    if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
      try {
        const url = new URL(baseUrl);
        url.searchParams.set('mid', meetingId);
        return url.toString();
      } catch (e) {
        // Fallback: simple append
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}mid=${encodeURIComponent(meetingId)}`;
      }
    }
    
    // Default: assume baseUrl ends with ?mid= and just append meetingId
    return `${baseUrl}${encodeURIComponent(meetingId)}`;
  };

  const inviteLinkFromMeetingId = buildInviteLinkFromMeetingId();
  
  // Prefer externalInviteLink if available, otherwise use meetingId-based link
  const inviteLink = externalInviteLink || inviteLinkFromMeetingId;
  // Temporary: invite link UI is disabled until backend URLs are stable
  const invitesFeatureEnabled = false;

  const copyData = async (content: string, type: string) => {
    if (type === 'join-url') setCopyingJoinUrl(true);
    if (type === 'dial-in') setCopyingDialIn(true);
    if (type === 'invite-link') setCopyingInviteLink(true);

    await navigator.clipboard.writeText(content);

    setTimeout(() => {
      if (type === 'join-url') setCopyingJoinUrl(false);
      if (type === 'dial-in') setCopyingDialIn(false);
      if (type === 'invite-link') setCopyingInviteLink(false);
    }, COPY_MESSAGE_TIMEOUT);
  };

  const { isMobile } = deviceInfo;

  return (
    <ModalSimple
      title={intl.formatMessage(intlMessages.title)}
      headerPosition="top"
      dismiss={{
        label: intl.formatMessage(intlMessages.dismissLabel),
        description: intl.formatMessage(intlMessages.dismissDesc),
      }}
      data-test="sessionDetailsModal"
      {...{
        isOpen,
        onRequestClose,
        priority,
        anchorElement,
      }}
    >
      <Styled.Chevron />
      <Styled.Container
        isFullWidth={isMobile || !(loginUrl || (formattedDialNum && formattedTelVoice))}
      >
        <Styled.Section>
          {/* Welcome / description */}
          {(welcomeMessage || welcomeMsgForModerators) && (
            <Styled.WelcomeMessage
              dangerouslySetInnerHTML={{
                __html: welcomeMessage || welcomeMsgForModerators,
              }}
            />
          )}

          {/* Invite link (coming soon – backend not final yet) */}
          {inviteLink && !invitesFeatureEnabled && (
            <>
              <Styled.JoinTitle>
                Invite link (coming soon)
              </Styled.JoinTitle>
              <Styled.Description>
                Direct invite links will be available in a future update. For now, please share this room from your website as usual.
              </Styled.Description>
            </>
          )}

          {inviteLink && invitesFeatureEnabled && (
            <>
              <Styled.JoinTitle>
                Invite link
                <Styled.CopyButton
                  key="copy-invite-link"
                  onClick={() => copyData(inviteLink, 'invite-link')}
                  hideLabel
                  color="light"
                  icon={copyingInviteLink ? 'check' : 'copy'}
                  size="sm"
                  circle
                  ghost
                  label={copyingInviteLink
                    ? intl.formatMessage(intlMessages.copied)
                    : 'Copy invite link'}
                />
              </Styled.JoinTitle>
              <Styled.LinkText>
                <a href={inviteLink} target="_blank" rel="noopener noreferrer">
                  {inviteLink}
                </a>
              </Styled.LinkText>
              <Styled.Description>
                Share this link so guests can join this room from your website.
              </Styled.Description>
            </>
          )}

          {/* Optional host URL and phone info, kept subtle underneath */}
          {loginUrl && (
            <>
              <Styled.JoinTitle>
                {intl.formatMessage(intlMessages.joinByUrlLabel)}
                <Styled.CopyButton
                  key="copy-join-url"
                  onClick={() => copyData(loginUrl, 'join-url')}
                  hideLabel
                  color="light"
                  icon={copyingJoinUrl ? 'check' : 'copy'}
                  size="sm"
                  circle
                  ghost
                  label={copyingJoinUrl
                    ? intl.formatMessage(intlMessages.copied)
                    : intl.formatMessage(intlMessages.copyUrlTooltip)}
                />
              </Styled.JoinTitle>
              <Styled.LinkText>
                <a href={loginUrl} target="_blank" rel="noopener noreferrer">
                  {loginUrl}
                </a>
              </Styled.LinkText>
            </>
          )}

          {(formattedDialNum && formattedTelVoice) && (
            <>
              <Styled.JoinTitle>
                {intl.formatMessage(intlMessages.joinByPhoneLabel)}
                <Styled.CopyButton
                  key="copy-dial-in"
                  onClick={() => copyData(formattedDialNum, 'dial-in')}
                  hideLabel
                  color="light"
                  icon={copyingDialIn ? 'check' : 'copy'}
                  size="sm"
                  circle
                  ghost
                  label={copyingDialIn
                    ? intl.formatMessage(intlMessages.copied)
                    : intl.formatMessage(intlMessages.copyPhoneTooltip)}
                />
              </Styled.JoinTitle>
              <Styled.LinkText>{formattedDialNum}</Styled.LinkText>
              <Styled.Description>
                <b>
                  {`${intl.formatMessage(intlMessages.phonePinLabel)}:`}
                </b>
                {` ${formattedPin} #`}
              </Styled.Description>
            </>
          )}
        </Styled.Section>
      </Styled.Container>
    </ModalSimple>
  );
};

const SessionDetailsContainer: React.FC<SessionDetailsContainerProps> = ({
  isOpen,
  onRequestClose,
  priority,
}) => {
  const {
    data: welcomeData,
    loading: welcomeLoading,
    error: welcomeError,
  } = useQuery<WelcomeMsgsResponse>(GET_WELCOME_MESSAGE);

  const { loading, data: currentMeeting } = useMeeting((m) => {
    return {
      name: m.name,
      meetingId: m.meetingId,
      loginUrl: m.loginUrl,
      voiceSettings: m.voiceSettings,
    };
  });

  const { data: currentUserData } = useCurrentUser((user) => ({
    isModerator: user.isModerator,
  }));

  if (welcomeLoading) return null;
  if (welcomeError) return <div>{JSON.stringify(welcomeError)}</div>;
  if (!welcomeData || loading || !currentMeeting) return null;

  const invalidDialNumbers = ['0', '613-555-1212', '613-555-1234', '0000'];

  let formattedDialNum = '';
  let formattedTelVoice = '';

  if (currentMeeting && currentMeeting.voiceSettings) {
    const { dialNumber, telVoice } = currentMeeting.voiceSettings;
    if (invalidDialNumbers.indexOf(dialNumber) < 0) {
      formattedDialNum = dialNumber;
      formattedTelVoice = telVoice;
    }
  }

  const anchorElement = document.getElementById('presentationTitle') as HTMLElement;

  // login url should only be displayed for moderators
  let loginUrl = currentMeeting.loginUrl ?? '';
  const isModerator = currentUserData?.isModerator;

  if (!isModerator) {
    loginUrl = '';
  }

  return (
    <SessionDetails
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      priority={priority}
      loginUrl={loginUrl}
      welcomeMessage={welcomeData.user_welcomeMsgs[0]?.welcomeMsg ?? ''}
      welcomeMsgForModerators={welcomeData.user_welcomeMsgs[0]?.welcomeMsgForModerators ?? ''}
      formattedDialNum={formattedDialNum}
      formattedTelVoice={formattedTelVoice}
      anchorElement={anchorElement}
      meetingId={currentMeeting?.meetingId ?? ''}
    />
  );
};

export default SessionDetailsContainer;
