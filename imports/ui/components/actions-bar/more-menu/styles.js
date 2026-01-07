import styled from 'styled-components';
import Button from '/imports/ui/components/common/button/component';
import { colorWhite } from '/imports/ui/stylesheets/styled-components/palette';
import { hasPhoneWidth } from '/imports/ui/stylesheets/styled-components/breakpoints';

const MoreButton = styled(Button)`
  min-width: 44px !important;
  min-height: 44px !important;
  width: 44px !important;
  height: 44px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  box-shadow: none !important;
  background: ${colorWhite} !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @media ${hasPhoneWidth} {
    min-width: 40px !important;
    min-height: 40px !important;
    width: 40px !important;
    height: 40px !important;
  }
`;

export default {
  MoreButton,
};
