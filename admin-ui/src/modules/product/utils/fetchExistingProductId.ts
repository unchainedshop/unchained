import { ApolloClient, gql } from '@apollo/client';

const ProductQuery = gql`
  query ProductExist($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      _id
    }
  }
`;

export async function fetchExistingProductId(
  productId: string,
  client: ApolloClient,
) {
  const result: any = {};

  const { data } = await client.query({
    query: ProductQuery,
    variables: { productId },
  });

  return (data as any)?.product?._id;
}
