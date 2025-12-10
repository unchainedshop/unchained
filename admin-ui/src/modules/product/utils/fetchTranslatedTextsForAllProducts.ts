import { ApolloClient } from '@apollo/client';
import { GetTranslatedProductTextsQuery } from '../hooks/useTranslatedProductTexts';
import {
  IProduct,
  ITranslatedProductTextsQuery,
  ITranslatedProductTextsQueryVariables,
} from '../../../gql/types';

export async function fetchTranslatedTextsForAllProducts(
  products: IProduct[],
  client: ApolloClient,
) {
  const result: any = {};

  await Promise.all(
    products.map(async (product: any) => {
      const { data } = await client.query<
        ITranslatedProductTextsQuery,
        ITranslatedProductTextsQueryVariables
      >({
        query: GetTranslatedProductTextsQuery(),
        variables: { productId: product._id },
      });

      result[product._id] = data?.translatedProductTexts || [];
    }),
  );

  return result;
}
