import { gql } from '@apollo/client';

const FilterFragment = gql`
  fragment FilterFragment on Filter {
    _id
    updated
    created
    key
    isActive
    type
    options {
      _id
      texts {
        _id
        title
        subtitle
        locale
      }
      value
    }
  }
`;

export default FilterFragment;
