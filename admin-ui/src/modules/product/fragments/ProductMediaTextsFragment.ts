import { gql } from '@apollo/client';

const ProductMediaTextsFragment = gql`
  fragment ProductMediaTextsFragment on ProductMediaTexts {
    _id
    locale
    title
    subtitle
  }
`;

export default ProductMediaTextsFragment;
