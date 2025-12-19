import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
// @ts-ignore
import ReactModal from 'react-modal';
import Styled from './styles';
import ChatListContainer from '/imports/ui/components/user-list/user-list-content/user-messages/chat-list/component';
import Icon from '/imports/ui/components/common/icon/icon-ts/component';
import Button from '/imports/ui/components/common/button/component';

const intlMessages = defineMessages({
  privateChatTitle: {
    id: 'app.chat.titlePrivate',
    description: 'Private chat title',
  },
  closeLabel: {
    id: 'app.chat.closeChatLabel',
    description: 'Close chat label',
  },
});

interface PrivateChatModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
}

const PrivateChatModal: React.FC<PrivateChatModalProps> = ({
  isOpen,
  onRequestClose,
}) => {
  const intl = useIntl();

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={intl.formatMessage(intlMessages.privateChatTitle)}
      className="PrivateChatModal__content"
      overlayClassName="PrivateChatModal__overlay"
      appElement={document.getElementById('app') || undefined}
    >
      <Styled.Modal>
        <Styled.Header>
          <Styled.Title>
            <Icon iconName="chat" />
            <span>{intl.formatMessage(intlMessages.privateChatTitle)}</span>
          </Styled.Title>
          <Button
            icon="close"
            onClick={onRequestClose}
            label={intl.formatMessage(intlMessages.closeLabel)}
            hideLabel
            size="md"
            color="default"
            data-test="closePrivateChatModal"
          />
        </Styled.Header>
        <Styled.Content>
          <ChatListContainer />
        </Styled.Content>
      </Styled.Modal>
    </ReactModal>
  );
};

export default PrivateChatModal;

