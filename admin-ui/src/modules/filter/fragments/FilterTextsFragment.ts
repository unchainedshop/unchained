import { gql } from '@apollo/client';

const FilterTextsFragment = gql`
  fragment FilterTextsFragment on FilterTexts {
    _id
    locale
    title
    subtitle
  }
`;

export default FilterTextsFragment;
