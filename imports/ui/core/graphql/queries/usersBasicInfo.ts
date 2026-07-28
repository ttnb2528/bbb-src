import { gql } from '@apollo/client';

const USERS_BASIC_INFO_SUBSCRIPTION = gql`
  subscription UsersBasicInfo {
    user(order_by: {nameSortable: asc, userId: asc}) {
      userId
      extId
      name
      isModerator
      color
      role
      avatar
      presenter
      isSpotlighted
    }
  }
`;

export default USERS_BASIC_INFO_SUBSCRIPTION;
