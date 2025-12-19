import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import Styled from './styles';

const intlMessages = defineMessages({
  liveIndicatorLabel: {
    id: 'app.actionsBar.liveIndicator.label',
    description: 'Live indicator label',
  },
});

const LiveIndicator: React.FC = () => {
  const intl = useIntl();

  return (
    <Styled.LiveIndicator
      aria-label={intl.formatMessage(intlMessages.liveIndicatorLabel)}
      data-test="liveIndicator"
    >
      <Styled.LiveDot />
      <Styled.LiveText>LIVE</Styled.LiveText>
    </Styled.LiveIndicator>
  );
};

export default LiveIndicator;

