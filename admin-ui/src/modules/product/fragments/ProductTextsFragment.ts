import { gql } from '@apollo/client';

const ProductTextsFragment = gql`
  fragment ProductTextsFragment on ProductTexts {
    _id
    locale
    slug
    title
    subtitle
    description
    vendor
    brand
    labels
  }
`;

export default ProductTextsFragment;
