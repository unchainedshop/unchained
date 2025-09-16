import { gql } from '@apollo/client';

const AssortmentMediaTextsFragment = gql`
  fragment AssortmentMediaTextsFragment on AssortmentMediaTexts {
    _id
    locale
    title
    subtitle
  }
`;

export default AssortmentMediaTextsFragment;
