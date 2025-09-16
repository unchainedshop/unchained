import { gql } from '@apollo/client';

const ProductDimensionFragment = gql`
  fragment ProductDimensionFragment on Dimensions {
    weight(unit: GRAM)
    length(unit: MILLIMETERS)
    width(unit: MILLIMETERS)
    height(unit: MILLIMETERS)
  }
`;

export default ProductDimensionFragment;
