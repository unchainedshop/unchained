import { gql } from '@apollo/client';

const FilterOptionFragment = gql`
  fragment FilterOptionFragment on FilterOption {
    _id
    texts(forceLocale: $forceLocale) {
      _id
      title
      subtitle
      locale
    }
    value
  }
`;

export default FilterOptionFragment;
