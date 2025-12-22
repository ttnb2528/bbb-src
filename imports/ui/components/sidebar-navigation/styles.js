import styled from 'styled-components';
import { colorWhite, colorGrayLight } from '/imports/ui/stylesheets/styled-components/palette';
import { borderSize, borderRadius } from '/imports/ui/stylesheets/styled-components/general';

const SidebarNavigationWrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${colorWhite};
  border-radius: ${borderRadius} ${borderRadius} 0 0;
  border: none; /* Bỏ border theo yêu cầu */
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export default {
  SidebarNavigationWrapper,
};

