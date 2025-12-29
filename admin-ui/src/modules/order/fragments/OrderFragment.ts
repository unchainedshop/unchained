import { gql } from '@apollo/client';

const OrderFragment = gql`
  fragment OrderFragment on Order {
    _id
    status
    created
    updated
    ordered
    orderNumber
    confirmed
    fulfilled
    contact {
      telNumber
      emailAddress
    }
    total {
      isTaxable
      isNetPrice
      amount
      currencyCode
    }
    user {
      _id
      username
      isGuest
      avatar {
        _id
        url
      }
      profile {
        displayName
        address {
          firstName
          lastName
        }
      }
    }
  }
`;

export default OrderFragment;
