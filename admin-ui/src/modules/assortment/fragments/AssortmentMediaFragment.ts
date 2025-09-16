import { gql } from '@apollo/client';
import AssortmentMediaTextsFragment from './AssortmentMediaTextsFragment';

const AssortmentMediaFragment = gql`
  fragment AssortmentMediaFragment on AssortmentMedia {
    _id
    tags
    file {
      _id
      url
    }
    texts {
      ...AssortmentMediaTextsFragment
    }
  }
  ${AssortmentMediaTextsFragment}
`;

export default AssortmentMediaFragment;
