import { gql } from '@apollo/client';

export const TokenFragment = gql`
  fragment TokenFragment on Token {
    _id
    walletAddress
    status
    quantity
    contractAddress
    chainId
    tokenSerialNumber
    invalidatedDate
    expiryDate
    ercMetadata
    accessKey
    isInvalidateable
  }
`;

export const ProductBriefFragment = gql`
  fragment ProductBriefFragment on Product {
    texts(forceLocale: $forceLocale) {
      _id
      slug
      title
      subtitle
      description
      vendor
      brand
      labels
      locale
    }
    _id
    sequence
    status
    tags
    sequence
    updated
    published
    media {
      _id
      tags
      file {
        _id
        url
      }
    }
    ... on BundleProduct {
      proxies {
        __typename
      }
    }
    ... on SimpleProduct {
      catalogPrice {
        amount
        currencyCode
      }
      proxies {
        __typename
      }
    }
    ... on PlanProduct {
      catalogPrice {
        amount
        currencyCode
      }
      proxies {
        __typename
      }
    }
  }
`;
