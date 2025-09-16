import { gql } from '@apollo/client';

const CountryFragment = gql`
  fragment CountryFragment on Country {
    _id
    isoCode
    isActive
    isBase

    defaultCurrency {
      _id
      isoCode
    }
  }
`;

export default CountryFragment;
