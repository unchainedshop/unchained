import { gql } from '@apollo/client';

const ProductCatalogPriceFragment = gql`
  fragment ProductCatalogPriceFragment on ProductCatalogPrice {
    isTaxable
    isNetPrice
    country {
      _id
      isoCode
      name
      flagEmoji
    }
    currency {
      _id
      isoCode
      isActive
    }
    amount
    minQuantity
  }
`;

export default ProductCatalogPriceFragment;
