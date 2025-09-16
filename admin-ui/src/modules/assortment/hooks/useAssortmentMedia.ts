import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IAssortmentMediaQuery,
  IAssortmentMediaQueryVariables,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';

const AssortmentMediaQuery = gql`
  query AssortmentMedia($assortmentId: ID, $slug: String) {
    assortment(assortmentId: $assortmentId, slug: $slug) {
      _id
      media {
        _id
        tags
        texts {
          _id
          locale
          title
          subtitle
        }
        file {
          _id
          url
          name
          size
          type
        }
        sortKey
      }
    }
  }
`;

const useAssortmentMedia = ({
  assortmentId: id = null,
  slug = null,
}: IAssortmentMediaQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);
  const { data, loading, error } = useQuery<IAssortmentMediaQuery>(
    AssortmentMediaQuery,
    {
      skip: !id && !parsedId,
      variables: {
        assortmentId: id || parsedId,
      },
    },
  );

  return {
    loading,
    error,
    assortmentMedia: data?.assortment?.media || [],
  };
};

export default useAssortmentMedia;
