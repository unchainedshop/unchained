import { gql } from '@apollo/client';

const ProductAssignmentFragment = gql`
  fragment ProductAssignmentFragment on ProductVariationAssignment {
    _id
    vectors {
      _id
      option {
        _id
        value
        texts {
          _id
          title
          subtitle
        }
      }
      variation {
        _id
        key
        texts {
          _id
          locale
          title
        }
      }
    }
    product {
      _id
      texts {
        _id
        title
        slug
        subtitle
      }
    }
  }
`;

export default ProductAssignmentFragment;
