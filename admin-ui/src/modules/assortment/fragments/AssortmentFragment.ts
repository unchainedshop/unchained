import { gql } from '@apollo/client';

const AssortmentFragment = gql`
  fragment AssortmentFragment on Assortment {
    _id
    isActive
    created
    updated
    sequence
    isRoot
    tags
    texts(forceLocale: $forceLocale) {
      _id
      slug
      title
      subtitle
      description
    }
    childrenCount
    media {
      _id
      tags
      file {
        _id
        url
      }
    }
  }
`;

export default AssortmentFragment;
