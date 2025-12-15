import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IAssortmentQuery,
  IAssortmentQueryVariables,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';

import AssortmentFragment from '../fragments/AssortmentFragment';
import useApp from '../../common/hooks/useApp';

const GetAssortmentQuery = (inlineFragment = '') => gql`
  query Assortment($assortmentId: ID, $slug: String, $forceLocale: Locale) {
    assortment(assortmentId: $assortmentId, slug: $slug) {
      ...AssortmentFragment
      ${inlineFragment}
    }
  }
  ${AssortmentFragment}
`;

const useAssortment = ({
  assortmentId: id = null,
  slug = null,
}: IAssortmentQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);
  const { customProperties, hydrateFragment } = useUnchainedContext();
  const { selectedLocale } = useApp();
  const { data, loading, error } = useQuery<IAssortmentQuery>(
    GetAssortmentQuery(customProperties?.Assortment),
    {
      skip: !id && !slug,
      variables: {
        assortmentId: id || parsedId,
        forceLocale: selectedLocale,
      },
    },
  );

  const assortment = data?.assortment;

  const extendedData = hydrateFragment(
    customProperties?.Assortment,
    assortment,
  );

  return {
    loading,
    error,
    assortment,
    extendedData,
  };
};

export default useAssortment;
