import { gql } from '@apollo/client';

const ProductVariationFragment = gql`
  fragment ProductVariationFragment on ProductVariation {
    _id
    type
    key
    texts(forceLocale: $locale) {
      _id
      locale
      title
      subtitle
    }
    options {
      _id
      texts(forceLocale: $locale) {
        _id
        locale
        title
        subtitle
      }
      value
    }
  }
`;

export default ProductVariationFragment;
