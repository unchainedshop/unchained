import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IAssortmentLinksQuery } from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';
import AssortmentFragment from '../fragments/AssortmentFragment';

const AssortmentLinksQuery = gql`
  query AssortmentLinks($assortmentId: ID, $slug: String) {
    assortment(assortmentId: $assortmentId, slug: $slug) {
      _id
      linkedAssortments {
        _id
        sortKey
        parent {
          ...AssortmentFragment
        }
        child {
          ...AssortmentFragment
        }
      }
    }
  }
  ${AssortmentFragment}
`;

const useAssortmentLinks = ({ assortmentId: id = null, slug = null } = {}) => {
  const parsedId = parseUniqueId(slug);
  const { data, loading, error } = useQuery<IAssortmentLinksQuery>(
    AssortmentLinksQuery,
    {
      skip: !id && !parsedId,
      variables: {
        assortmentId: id || parsedId,
      },
    },
  );
  const assortment = data?.assortment;
  const linkedAssortments = assortment?.linkedAssortments || [];

  return {
    loading,
    error,
    linkedAssortments,
  };
};

export default useAssortmentLinks;
