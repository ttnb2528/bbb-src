import styled from 'styled-components';
import { colorWhite, colorBackground, colorDanger } from '/imports/ui/stylesheets/styled-components/palette';
import { smPaddingX, smPaddingY, borderRadius, borderSize } from '/imports/ui/stylesheets/styled-components/general';
import { hasPhoneWidth, smallOnly } from '/imports/ui/stylesheets/styled-components/breakpoints';

const Container = styled.div`
  position: fixed;
  bottom: calc(var(--actionbar-height, 80px) + 12px);
  left: 8px;
  right: 8px;
  transform: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background-color: ${colorBackground};
  border-radius: ${borderRadius};
  box-shadow: none; /* bỏ đổ bóng để panel không nổi lên quá nhiều */
  z-index: 50;

  @media ${smallOnly} {
    bottom: calc(var(--actionbar-height, 70px) + 10px);
    left: 6px;
    right: 6px;
    gap: 10px;
    padding: 8px 10px;
  }

  @media ${hasPhoneWidth} {
    bottom: calc(var(--actionbar-height, 60px) + 8px);
    left: 22px;
    right: 22px;
    gap: 8px;
    padding: 6px 8px;
  }
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto; /* Đẩy nút chat sang bên phải */
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
  LeftGroup,
  RightGroup,
  BadgeWrapper,
  UnreadBadge,
};

