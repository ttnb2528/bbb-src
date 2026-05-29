import styled from 'styled-components';
import { smallOnly } from '/imports/ui/stylesheets/styled-components/breakpoints';
import Button from '/imports/ui/components/common/button/component';

const LeaveButton = styled(Button)`
  /* Đồng bộ kích thước, dạng tròn như các action */
  min-width: 36px !important;
  min-height: 36px !important;
  width: 36px !important;
  height: 36px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  font-size: 1rem;
  line-height: 1.1rem;
  font-weight: 400;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;

  & > i {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    line-height: 1;
  }

  svg {
    display: block;
    width: 1.05rem;
    height: 1.05rem;
  }

  ${({ state }) => state === 'open' && `
    @media ${smallOnly} {
      display: none;
    }
  `}

  ${({ state }) => state === 'closed' && `
  @media ${smallOnly} {
    margin-left: 0;
    margin-right: 0;
  }
`}

  ${({ isMobile }) => !isMobile && `
    margin-left: 1.0rem;
    margin-right: 0.5rem;
  `}

  ${({ state }) => state === 'closed' && `
    z-index: 3;
  `}
`;

export default {
  LeaveButton,
};
