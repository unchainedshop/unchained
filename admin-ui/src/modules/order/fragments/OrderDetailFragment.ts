import { gql } from '@apollo/client';
import AddressFragment from '../../common/fragments/AddressFragment';

const OrderDetailFragment = gql`
  fragment OrderDetailFragment on Order {
    _id
    totalTax: total(category: TAXES) {
      amount
      currencyCode
    }
    itemsTotal: total(category: ITEMS) {
      amount
      currencyCode
    }
    totalDiscount: total(category: DISCOUNTS) {
      amount
      currencyCode
    }

    totalPayment: total(category: PAYMENT) {
      amount
      currencyCode
    }
    totalDelivery: total(category: DELIVERY) {
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
    discounts {
      _id
      trigger
      code
      interface {
        _id
        label
        version
      }
      total {
        amount
        currencyCode
        isTaxable
        isNetPrice
      }
      discounted {
        _id
        orderDiscount {
          _id
          total {
            amount
            currencyCode
            isTaxable
            isNetPrice
          }
        }
        total {
          amount
          currencyCode
          isTaxable
          isNetPrice
        }
      }
    }
    payment {
      _id
      provider {
        _id
        type
        interface {
          _id
          label
          version
        }
      }
      status
      fee {
        currencyCode
        amount
      }
      paid
    }

    orderNumber
    status
    created
    updated
    ordered

    confirmed
    fullfilled
    contact {
      telNumber
      emailAddress
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
    billingAddress {
      ...AddressFragment
    }
    delivery {
      _id
      ... on OrderDeliveryPickUp {
        activePickUpLocation {
          _id
          name
          address {
            ...AddressFragment
          }
        }
      }
      ... on OrderDeliveryShipping {
        address {
          ...AddressFragment
        }
      }
      provider {
        _id
        created
        updated
        deleted
        type
        configuration
        interface {
          _id
          label
          version
        }
      }
      status
      delivered
      fee {
        isTaxable
        isNetPrice
        amount
        currencyCode
      }
      discounts {
        _id
        orderDiscount {
          _id
          trigger
          code
          order {
            _id
            orderNumber
          }
          interface {
            _id
            label
            version
          }
          total {
            isTaxable
            isNetPrice
            amount
            currencyCode
          }
          discounted {
            _id
            orderDiscount {
              _id
              trigger
              code
              order {
                _id
                orderNumber
              }
              interface {
                _id
                label
                version
              }
              total {
                isTaxable
                isNetPrice
                amount
                currencyCode
              }
            }
          }
        }
      }

      delivered
    }
    total {
      isTaxable
      isTaxable
      amount
      currencyCode
    }
    items {
      _id
      product {
        _id
        texts {
          _id
          slug
          brand
          vendor
          title
          subtitle
        }
        media {
          _id
          file {
            _id
            url
          }
        }
      }
      quantity

      unitPrice {
        amount
        isTaxable
        isNetPrice
        currencyCode
      }
      total {
        amount
        isTaxable
        isNetPrice
        currencyCode
      }
    }
  }
  ${AddressFragment}
`;

export default OrderDetailFragment;
