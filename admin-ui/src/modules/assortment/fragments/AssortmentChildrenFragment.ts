import { gql } from '@apollo/client';

const AssortmentChildrenFragment = gql`
  fragment AssortmentChildrenFragment on Assortment {
    _id
    texts {
      _id
      slug
      title
      subtitle
    }
    childrenCount
  }
`;

export default AssortmentChildrenFragment;
