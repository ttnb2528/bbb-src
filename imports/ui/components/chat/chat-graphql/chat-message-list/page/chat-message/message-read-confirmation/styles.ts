import styled from 'styled-components';
import {
  colorPrimary,
  colorGrayLight,
} from '/imports/ui/stylesheets/styled-components/palette';
import Icon from '/imports/ui/components/common/icon/icon-ts/component';

// Icon check đơn - màu xám khi chưa xem
export const ReadIcon = styled(Icon)`
  color: ${colorGrayLight};
  font-size: 13px;
  opacity: 0.8;
  line-height: 1;
`;

// Icon check đôi - màu xanh khi đã xem
// Hiển thị 2 check mark nằm cạnh nhau, không đè lên (giống Zalo/Messenger)
export const DoubleCheckWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  width: auto;
  height: 13px;
`;

export const DoubleCheckIcon = styled(Icon)`
  color: ${colorPrimary};
  font-size: 13px;
  line-height: 1;
  flex-shrink: 0;
  
  &:first-child {
    opacity: 0.7;
  }
  
  &:last-child {
    opacity: 1;
  }
`;

export const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  margin-left: 6px;
  min-width: 18px;
  height: 13px;
  vertical-align: middle;
  flex-shrink: 0;
`;
