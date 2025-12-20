import styled from 'styled-components';
import { colorWhite, colorBackground, colorDanger } from '/imports/ui/stylesheets/styled-components/palette';
import { smPaddingX, smPaddingY, borderRadius, borderSize } from '/imports/ui/stylesheets/styled-components/general';
import { hasPhoneWidth, smallOnly } from '/imports/ui/stylesheets/styled-components/breakpoints';

const Container = styled.div`
  position: fixed;
  bottom: calc(var(--actionbar-height, 80px) + 12px); /* Tăng khoảng cách với footer */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px; /* Tăng gap để buttons không dính nhau */
  padding: 10px 16px; /* Tăng padding để đẹp hơn */
  background-color: ${colorBackground};
  border-radius: ${borderRadius};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 50; /* Thấp hơn video để không đè lên */
  border: ${borderSize} solid rgba(255, 255, 255, 0.1);

  @media ${smallOnly} {
    bottom: calc(var(--actionbar-height, 70px) + 10px);
    gap: 10px; /* Tăng từ 6px */
    padding: 8px 12px; /* Tăng padding */
  }

  @media ${hasPhoneWidth} {
    bottom: calc(var(--actionbar-height, 60px) + 8px);
    gap: 8px; /* Tăng từ 4px */
    padding: 6px 10px; /* Tăng padding */
  }
`;

const BadgeWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const UnreadBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background-color: ${colorDanger};
  color: ${colorWhite};
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  @media ${hasPhoneWidth} {
    top: -2px;
    right: -2px;
    min-width: 14px;
    height: 14px;
    font-size: 9px;
  }
`;

export default {
  Container,
  BadgeWrapper,
  UnreadBadge,
};

