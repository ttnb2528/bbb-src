import styled from 'styled-components';
import { colorPrimary, colorWhite, colorDanger } from '/imports/ui/stylesheets/styled-components/palette';

export const NotificationContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin: 12px;
  background: rgba(255, 152, 0, 0.15);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 8px;
  color: ${colorWhite};
`;

export const Icon = styled.div`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff9800;
  font-size: 20px;
`;

export const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const Message = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: ${colorWhite};
  font-weight: 500;
`;

export const Position = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
`;

const Styled = {
  NotificationContainer,
  Icon,
  Content,
  Message,
  Position,
};

export default Styled;
