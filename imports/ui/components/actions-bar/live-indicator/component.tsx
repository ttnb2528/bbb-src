import React from 'react';
import Styled from './styles';

const LiveIndicator: React.FC = () => (
  <Styled.LiveIndicator
    aria-label="Live"
    data-test="liveIndicator"
  >
    <Styled.LiveDot />
    <Styled.LiveText>LIVE</Styled.LiveText>
  </Styled.LiveIndicator>
);

export default LiveIndicator;

