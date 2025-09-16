import { gql } from '@apollo/client';
import MD5MetaDataFragment from './MD5MetaDataFragment';

const UserFragment = gql`
  fragment UserFragment on User {
    _id
    lastBillingAddress {
      firstName
      lastName
      company
      addressLine
      addressLine2
      postalCode
      countryCode
      regionCode
      city
    }
    lastContact {
      emailAddress
      telNumber
    }
    lastLogin {
      countryCode
      locale
      remoteAddress
      remotePort
      timestamp
      userAgent
    }
    avatar {
      _id
      name
      size
      type
      url
    }
    allowedActions
    paymentCredentials {
      _id
      isValid
      isPreferred
      paymentProvider {
        _id
        type
        interface {
          _id
          label
          version
        }
      }
    }
    emails {
      verified
      address
    }
    web3Addresses {
      address
      nonce
      verified
    }
    webAuthnCredentials {
      _id
      created
      aaguid
      counter
      mdsMetadata {
        ...MD5MetaDataFragment
      }
    }
    profile {
      displayName
      phoneMobile
      gender
      address {
        firstName
        lastName
        company
        addressLine
        addressLine2
        postalCode
        countryCode
        regionCode
        city
      }
      birthday
    }
    username
    primaryEmail {
      verified
      address
    }
    isGuest
    isInitialPassword
    name
    roles
    tags
    deleted
    cart {
      _id
      items {
        _id
      }
    }
    orders {
      _id
      items {
        _id
      }
    }
  }
  ${MD5MetaDataFragment}
`;

export default UserFragment;
