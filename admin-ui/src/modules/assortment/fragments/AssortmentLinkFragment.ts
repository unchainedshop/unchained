import { gql } from '@apollo/client';
import AssortmentFragment from './AssortmentFragment';

const AssortmentLinkFragment = gql`
  fragment AssortmentLinkFragment on AssortmentLink {
    _id
    sortKey
    parent {
      ...AssortmentFragment
    }
    child {
      ...AssortmentFragment
    }
  }
  ${AssortmentFragment}
`;

export default AssortmentLinkFragment;
