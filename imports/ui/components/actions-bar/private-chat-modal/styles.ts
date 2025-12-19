import styled from 'styled-components';
import { colorWhite, colorGrayLight, colorGrayDark } from '/imports/ui/stylesheets/styled-components/palette';
import { fontSizeBase, fontSizeLarge } from '/imports/ui/stylesheets/styled-components/typography';
import { smPaddingX, smPaddingY, borderSize } from '/imports/ui/stylesheets/styled-components/general';

const Modal = styled.div`
  display: flex;
  flex-direction: column;
  width: 600px;
  max-width: 90vw;
  height: 70vh;
  max-height: 600px;
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
  overflow-y: auto;
  padding: ${smPaddingX};
`;

export default {
  Modal,
  Header,
  Title,
  Content,
};

