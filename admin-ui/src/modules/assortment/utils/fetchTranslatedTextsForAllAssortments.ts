import { ApolloClient } from '@apollo/client';
import { TranslatedAssortmentTextsQuery } from '../hooks/useTranslatedAssortmentTexts';
import {
  IAssortment,
  IAssortmentChildrenQuery,
  IAssortmentChildrenQueryVariables,
  IAssortmentFiltersQuery,
  IAssortmentFiltersQueryVariables,
  IAssortmentLinksQuery,
  IAssortmentLinksQueryVariables,
  IAssortmentProductsQuery,
  IAssortmentProductsQueryVariables,
  ITranslatedAssortmentTextsQuery,
  ITranslatedAssortmentTextsQueryVariables,
} from '../../../gql/types';
import { AssortmentChildrenQuery } from '../hooks/useAssortmentChildren';
import { AssortmentProductsQuery } from '../hooks/useAssortmentProducts';
import { AssortmentLinksQuery } from '../hooks/useAssortmentLinks';
import { AssortmentFiltersQuery } from '../hooks/useAssortmentFilters';

interface AssortmentExportMap {
  assortments: Record<string, Record<string, any>[]>;
  products: Record<string, any[]>;
  children: Record<string, any[]>;
  filters: Record<string, any[]>;
}

export async function fetchTranslatedTextsForAllAssortments(
  assortments: IAssortment[],
  client: ApolloClient,
) {
  const result: AssortmentExportMap = {
    assortments: {},
    children: {},
    filters: {},
    products: {},
  };

  await Promise.all(
    assortments.map(async (assortment: any) => {
      const { data } = await client.query<
        ITranslatedAssortmentTextsQuery,
        ITranslatedAssortmentTextsQueryVariables
      >({
        query: TranslatedAssortmentTextsQuery,
        variables: { assortmentId: assortment?._id },
      });
      result.assortments[assortment._id] =
        (data as any).translatedAssortmentTexts || [];

      const { data: filtersData } = await client.query<
        IAssortmentFiltersQuery,
        IAssortmentFiltersQueryVariables
      >({
        query: AssortmentFiltersQuery,
        variables: {
          assortmentId: assortment?._id,
        },
      });
      result.filters[assortment._id] =
        filtersData?.assortment?.filterAssignments || [];

      const { data: productsData } = await client.query<
        IAssortmentProductsQuery,
        IAssortmentProductsQueryVariables
      >({
        query: AssortmentProductsQuery,
        variables: {
          assortmentId: assortment._id,
        },
      });
      result.products[assortment._id] =
        productsData?.assortment?.productAssignments || [];

      const { data: linksData } = await client.query<
        IAssortmentLinksQuery,
        IAssortmentLinksQueryVariables
      >({
        query: AssortmentLinksQuery,
        variables: {
          assortmentId: assortment._id,
        },
      });
      result.children[assortment._id] =
        linksData?.assortment?.linkedAssortments || [];
    }),
  );

  return result;
}
