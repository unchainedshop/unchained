import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IAssortmentChildrenQuery,
  IAssortmentChildrenQueryVariables,
} from '../../../gql/types';
import { parseSlug } from '../../common/utils/getUniqueId';
import AssortmentChildrenFragment from '../fragments/AssortmentChildrenFragment';

export const AssortmentChildrenQuery = gql`
  query AssortmentChildren(
    $slugs: [String!]
    $includeInactive: Boolean
    $includeLeaves: Boolean
  ) {
    assortments(
      slugs: $slugs
      includeInactive: $includeInactive
      includeLeaves: $includeLeaves
    ) {
      ...AssortmentChildrenFragment
      children {
        ...AssortmentChildrenFragment
      }
    }
  }
  ${AssortmentChildrenFragment}
`;

const useAssortmentChildren = ({
  slugs,
  includeInactive = false,
  includeLeaves = false,
  forceLocale,
}: IAssortmentChildrenQueryVariables & { forceLocale?: string }) => {
  const normalizedSlug = (slugs as string[])?.map((slug) => parseSlug(slug));
  const { data, loading, error } = useQuery<IAssortmentChildrenQuery>(
    AssortmentChildrenQuery,
    {
      variables: {
        slugs: normalizedSlug,
        includeInactive,
        includeLeaves,
      },
      context: {
        headers: {
          forceLocale,
        },
      },
    },
  );

  const assortments = data?.assortments || [];

  return { assortments, loading, error };
};

export default useAssortmentChildren;
