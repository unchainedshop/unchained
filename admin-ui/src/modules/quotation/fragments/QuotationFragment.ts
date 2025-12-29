import { gql } from '@apollo/client';

const QuotationFragment = gql`
  fragment QuotationFragment on Quotation {
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
    currency {
      _id
      contractAddress
      decimals
      isoCode
    }
    status
    created
    expires
    updated
    isExpired
    quotationNumber
    fulfilled
    rejected
  }
`;

export default QuotationFragment;
