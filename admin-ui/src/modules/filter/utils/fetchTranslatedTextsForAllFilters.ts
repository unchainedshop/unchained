import { ApolloClient } from '@apollo/client';
import {
  IFilter,
  IFilterOption,
  ITranslatedFilterTextsQuery,
  ITranslatedFilterTextsQueryVariables,
} from '../../../gql/types';
import { TranslatedFilterTextsQuery } from '../hooks/useTranslatedFilterTexts';

interface TranslatedTextsMap {
  filters: Record<string, Record<string, any>>;
  options: Record<string, Record<string, any>>;
}

export async function fetchTranslatedTextsForAllFilters(
  filters: IFilter[],
  client: ApolloClient,
): Promise<TranslatedTextsMap> {
  const result: TranslatedTextsMap = { filters: {}, options: {} };

  await Promise.all(
    filters.map(async (filter: IFilter) => {
      const { data: filterData } = await client.query<
        ITranslatedFilterTextsQuery,
        ITranslatedFilterTextsQueryVariables
      >({
        query: TranslatedFilterTextsQuery,
        variables: { filterId: filter._id },
      });
      result.filters[filter._id] = {};
      (filterData?.translatedFilterTexts || []).forEach((t) => {
        result.filters[filter._id][t.locale] = t;
      });
      const options = filter.options || [];
      await Promise.all(
        options.map(async (option: IFilterOption) => {
          const { data: optionData } = await client.query<
            ITranslatedFilterTextsQuery,
            ITranslatedFilterTextsQueryVariables
          >({
            query: TranslatedFilterTextsQuery,
            variables: {
              filterId: filter._id,
              filterOptionValue: option.value,
            },
          });

          result.options[option._id] = {};
          (optionData?.translatedFilterTexts || []).forEach((t) => {
            result.options[option._id][t.locale] = t;
          });
        }),
      );
    }),
  );

  return result;
}
