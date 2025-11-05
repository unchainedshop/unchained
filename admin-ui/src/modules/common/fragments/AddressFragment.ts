import { gql } from '@apollo/client';

const AddressFragment = gql`
  fragment AddressFragment on Address {
    firstName
    lastName
    company
    addressLine
    postalCode
    city
    countryCode
    regionCode
  }
`;

export default AddressFragment;
