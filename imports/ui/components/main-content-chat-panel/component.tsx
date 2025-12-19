import React from 'react';
import { layoutSelectInput, layoutDispatch } from '../layout/context';
import { ACTIONS, PANELS } from '../layout/enums';
import ChatContainer from '/imports/ui/components/chat/chat-graphql/component';
import NotesContainer from '/imports/ui/components/notes/component';
import Styled from './styles';
import ErrorBoundary from '/imports/ui/components/common/error-boundary/component';
import FallbackView from '/imports/ui/components/common/fallback-errors/fallback-view/component';
import { defineMessages, useIntl } from 'react-intl';
import Icon from '/imports/ui/components/common/icon/icon-ts/component';

const intlMessages = defineMessages({
  publicChatLabel: {
    id: 'app.chat.titlePublic',
    description: 'Public chat label',
  },
  sharedNotesLabel: {
    id: 'app.notes.title',
    description: 'Shared notes label',
  },
});

const MainContentChatPanel: React.FC = () => {
  const sidebarContent = layoutSelectInput((i: any) => i.sidebarContent);
  const layoutContextDispatch = layoutDispatch();
  const intl = useIntl();
  const { sidebarContentPanel, isOpen } = sidebarContent;

  const handleToggleChat = () => {
    if (isOpen && sidebarContentPanel === PANELS.CHAT) {
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
        value: false,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
        value: PANELS.NONE,
      });
    } else {
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
        value: true,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
        value: PANELS.CHAT,
      });
    }
  };

  const handleToggleNotes = () => {
    if (isOpen && sidebarContentPanel === PANELS.SHARED_NOTES) {
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
        value: false,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
        value: PANELS.NONE,
      });
    } else {
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
        value: true,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
        value: PANELS.SHARED_NOTES,
      });
    }
  };

  return (
    <Styled.Panel>
      <Styled.Buttons>
        <Styled.Button
          active={isOpen && sidebarContentPanel === PANELS.CHAT}
          onClick={handleToggleChat}
          data-test="publicChatButton"
          title={intl.formatMessage(intlMessages.publicChatLabel)}
        >
          <Icon iconName="chat" />
          <Styled.ButtonLabel>{intl.formatMessage(intlMessages.publicChatLabel)}</Styled.ButtonLabel>
        </Styled.Button>
        <Styled.Button
          active={isOpen && sidebarContentPanel === PANELS.SHARED_NOTES}
          onClick={handleToggleNotes}
          data-test="sharedNotesButton"
          title={intl.formatMessage(intlMessages.sharedNotesLabel)}
        >
          <Icon iconName="note" />
          <Styled.ButtonLabel>{intl.formatMessage(intlMessages.sharedNotesLabel)}</Styled.ButtonLabel>
        </Styled.Button>
      </Styled.Buttons>
      {isOpen && (sidebarContentPanel === PANELS.CHAT || sidebarContentPanel === PANELS.SHARED_NOTES) && (
        <Styled.Content>
          {sidebarContentPanel === PANELS.CHAT && (
            <ErrorBoundary Fallback={FallbackView}>
              <ChatContainer />
            </ErrorBoundary>
          )}
          {sidebarContentPanel === PANELS.SHARED_NOTES && (
            <NotesContainer isToSharedNotesBeShow={true} />
          )}
        </Styled.Content>
      )}
    </Styled.Panel>
  );
};

export default MainContentChatPanel;

