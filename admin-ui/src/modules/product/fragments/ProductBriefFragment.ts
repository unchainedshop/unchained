import { gql } from '@apollo/client';

const ProductBriefFragment = gql`
  fragment ProductBriefFragment on Product {
    texts {
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

export default ProductBriefFragment;
