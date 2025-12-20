import styled from 'styled-components';
import { fontSizeBase, fontSizeSmall } from '/imports/ui/stylesheets/styled-components/typography';
import { smPaddingX } from '/imports/ui/stylesheets/styled-components/general';
import { colorWhite, colorDanger } from '/imports/ui/stylesheets/styled-components/palette';
import { hasPhoneWidth } from '/imports/ui/stylesheets/styled-components/breakpoints';

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${smPaddingX};
  user-select: none;

  /* Mobile: giảm gap và có thể ẩn text */
  @media ${hasPhoneWidth} {
    gap: 3px;
  }
`;

const LiveDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${colorDanger};
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const LiveText = styled.span`
  color: ${colorWhite};
  font-size: ${fontSizeSmall};
  font-weight: 600;
  letter-spacing: 0.5px;

  /* Mobile: có thể ẩn text, chỉ hiện dot */
  @media ${hasPhoneWidth} {
    display: none;
  }
`;

export default {
  LiveIndicator,
  LiveDot,
  LiveText,
};

