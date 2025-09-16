import { gql } from '@apollo/client';

const QuotationDetailFragment = gql`
  fragment QuotationDetailFragment on Quotation {
    _id
    user {
      _id
      username
      avatar {
        _id
        url
      }
      name
      primaryEmail {
        verified
        address
      }
    }
    configuration {
      key
      value
    }
    country {
      _id
      isoCode
      flagEmoji
      name
    }
    currency {
      _id
      isoCode
      isActive
    }
    product {
      _id
      texts {
        _id
        slug
        subtitle
        title
        description
      }
      media {
        _id
        file {
          _id
          type
          url
        }
      }
    }
    status
    created
    expires
    updated
    isExpired
    quotationNumber
    fullfilled
    rejected
  }
`;

export default QuotationDetailFragment;
