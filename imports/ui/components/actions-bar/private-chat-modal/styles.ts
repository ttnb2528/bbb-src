import styled from 'styled-components';
import { colorWhite, colorGrayLight, colorGrayDark } from '/imports/ui/stylesheets/styled-components/palette';
import { fontSizeBase, fontSizeLarge } from '/imports/ui/stylesheets/styled-components/typography';
import { smPaddingX, smPaddingY, borderSize } from '/imports/ui/stylesheets/styled-components/general';

const Modal = styled.div`
  display: flex;
  flex-direction: column;
  width: 900px;
  max-width: 95vw;
  height: 70vh;
  max-height: 650px;
  background-color: ${colorWhite};
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${smPaddingY} ${smPaddingX};
  border-bottom: ${borderSize} solid ${colorGrayLight};
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: ${smPaddingX};
  font-size: ${fontSizeLarge};
  font-weight: 600;
  color: ${colorGrayDark};

  > [class^="icon-bbb-"] {
    font-size: ${fontSizeBase};
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
`;

const LeftPane = styled.div`
  flex: 0 0 260px;
  border-right: ${borderSize} solid ${colorGrayLight};
  padding: ${smPaddingY} ${smPaddingX};
  overflow-y: auto;
`;

const RightPane = styled.div`
  flex: 1;
  padding: ${smPaddingY} ${smPaddingX};
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export default {
  Modal,
  Header,
  Title,
  Content,
  LeftPane,
  RightPane,
};

