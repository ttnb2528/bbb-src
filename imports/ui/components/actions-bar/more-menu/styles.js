import styled from 'styled-components';
import Button from '/imports/ui/components/common/button/component';
import { colorWhite, colorDanger } from '/imports/ui/stylesheets/styled-components/palette';
import { hasPhoneWidth } from '/imports/ui/stylesheets/styled-components/breakpoints';

const BadgeWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

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

const UnreadBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 10px;
  background-color: ${colorDanger};
  color: ${colorWhite};
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
`;

const MenuItemLabel = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const MenuItemBadge = styled.span`
  margin-left: 8px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background-color: ${colorDanger};
  color: ${colorWhite};
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default {
  BadgeWrapper,
  MoreButton,
  UnreadBadge,
  MenuItemLabel,
  MenuItemBadge,
};
