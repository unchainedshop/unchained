import { gql } from '@apollo/client';

const AssortmentTextsFragment = gql`
  fragment AssortmentTextsFragment on AssortmentTexts {
    _id
    locale
    slug
    title
    subtitle
    description
  }
`;

export default AssortmentTextsFragment;
