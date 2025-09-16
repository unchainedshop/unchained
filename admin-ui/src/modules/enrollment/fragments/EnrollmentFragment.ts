import { gql } from '@apollo/client';

const EnrollmentFragment = gql`
  fragment EnrollmentFragment on Enrollment {
    _id
    country {
      _id
      isoCode
    }
    currency {
      _id
      isoCode
    }
    enrollmentNumber
    updated
    status
    created
    expires
    isExpired
    periods {
      start
      end
      isTrial
    }
    payment {
      provider {
        _id
      }
    }
    delivery {
      provider {
        _id
      }
    }
    plan {
      product {
        _id
        media {
          _id
          file {
            _id
            url
          }
        }
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

export default EnrollmentFragment;
