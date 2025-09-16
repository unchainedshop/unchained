import { gql } from '@apollo/client';

const LanguageFragment = gql`
  fragment LanguageFragment on Language {
    _id
    isoCode
    isActive
    isBase
    name
  }
`;

export default LanguageFragment;
