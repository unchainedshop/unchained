import { ApolloClient, gql } from '@apollo/client';
import { GetTranslatedProductTextsQuery } from '../hooks/useTranslatedProductTexts';

export async function fetchTranslatedTextsForAllProducts(
  products: any,
  client: ApolloClient,
) {
  const result: any = {};

  await Promise.all(
    products.map(async (product: any) => {
      const { data } = await client.query({
        query: GetTranslatedProductTextsQuery(),
        variables: { productId: product._id },
      });

      result[product._id] = (data as any).translatedProductTexts || [];
    }),
  );

  return result;
}
