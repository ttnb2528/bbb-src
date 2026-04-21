import styled from 'styled-components';
import { mdPaddingX, borderRadius } from '/imports/ui/stylesheets/styled-components/general';
import {
  fontSizeXL,
  fontSizeMD,
  fontSizeSmall,
} from '/imports/ui/stylesheets/styled-components/typography';
import { colorWhite, colorTipBg } from '/imports/ui/stylesheets/styled-components/palette';
import { smallOnly, mediumOnly } from '/imports/ui/stylesheets/styled-components/breakpoints';

const MuteWarning = styled.div`
  position: absolute !important;
  color: ${colorWhite};
  background-color: ${colorTipBg};
  text-align: center;
  line-height: 1.3;
  font-size: ${fontSizeXL};
  padding: ${mdPaddingX};
  border-radius: ${borderRadius};
  top: -60px; /* Use px because parent div has 0 height */
  margin-left: 24px; /* Center over the ~48px button */
  z-index: 9999 !important;
  cursor: pointer;
  width: max-content;
  max-width: 85vw;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);

  > span {
    white-space: normal;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  > span > i {
    margin: 0 2px;
  }

  @media ${smallOnly} {
    font-size: ${fontSizeMD};
    width: max-content;
    max-width: 90vw; /* Allow it to be wide but not overflow screen */
    position: fixed !important;
    bottom: 80px !important;
    top: auto !important;
    left: 50% !important;
    margin-left: 0 !important;
    transform: translateX(-50%) !important;
  }

  @media ${mediumOnly} {
    font-size: ${fontSizeSmall};
  }

  [dir="rtl"] & {
    transform: translateX(50%);
  }

  [dir="ltr"] & {
    transform: translateX(-50%);
  }
`;

export default {
  MuteWarning,
};
