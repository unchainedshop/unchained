import { ApolloClient } from '@apollo/client';
import { TranslatedAssortmentTextsQuery } from '../hooks/useTranslatedAssortmentTexts';
import {
  IAssortment,
  ITranslatedAssortmentTextsQuery,
  ITranslatedAssortmentTextsQueryVariables,
} from '../../../gql/types';

export async function fetchTranslatedTextsForAllAssortments(
  assortments: IAssortment[],
  client: ApolloClient,
) {
  const result: any = {};

  await Promise.all(
    assortments.map(async (assortment: any) => {
      const { data } = await client.query<
        ITranslatedAssortmentTextsQuery,
        ITranslatedAssortmentTextsQueryVariables
      >({
        query: TranslatedAssortmentTextsQuery,
        variables: { assortmentId: assortment?._id },
      });
      result[assortment._id] = (data as any).translatedAssortmentTexts || [];
    }),
  );

  return result;
}
