import { gql } from '@apollo/client';

const ProductMediaFragment = gql`
  fragment ProductMediaFragment on ProductMedia {
    _id
    tags
    file {
      _id
      name
      type
      size
      url
    }
    sortKey
    texts {
      _id
      locale
      title
      subtitle
    }
  }
`;

export default ProductMediaFragment;
