import { ApolloClient, gql } from '@apollo/client';
import {
  IProductExistQuery,
  IProductExistQueryVariables,
} from '../../../gql/types';

const ProductQuery = gql`
  query ProductExist($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      _id
      status
    }
  }
`;

export async function fetchExistingProductId(
  productId: string,
  client: ApolloClient,
) {
  const { data } = await client.query<
    IProductExistQuery,
    IProductExistQueryVariables
  >({
    query: ProductQuery,
    variables: { productId },
  });
  const { product } = data;

  if (!product || product.status === 'DELETED') {
    return null;
  }
  return product?._id;
}
