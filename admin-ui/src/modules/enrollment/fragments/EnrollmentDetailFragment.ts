import { gql } from '@apollo/client';

const EnrollmentDetailFragment = gql`
  fragment EnrollmentDetailFragment on Enrollment {
    _id
    country {
      _id
      isoCode
    }
    enrollmentNumber
    updated
    status
    created
    expires
    billingAddress {
      addressLine
      addressLine2
      city
      company
      countryCode
      firstName
      lastName
      postalCode
      regionCode
    }
    contact {
      emailAddress
      telNumber
    }
    currency {
      _id
      contractAddress
      decimals
      isActive
      isoCode
    }
    delivery {
      provider {
        _id
        configuration
        configurationError
        interface {
          _id
          label
          version
        }
        isActive

        simulatedPrice {
          amount
          currencyCode
          isNetPrice
          isTaxable
        }
        type
      }
    }
    payment {
      provider {
        _id
        configuration
        configurationError
        interface {
          _id
          label
          version
        }
        isActive
        type
      }
    }
    periods {
      end
      isTrial
      start
      order {
        _id
      }
    }

    isExpired
    periods {
      start
      end
      isTrial
    }
    plan {
      configuration {
        key
        value
      }
      product {
        _id
        texts {
          _id
          title
        }
      }
      quantity
    }
    user {
      _id
      username
      name
      avatar {
        _id
        url
      }
    }
  }
`;

export default EnrollmentDetailFragment;
