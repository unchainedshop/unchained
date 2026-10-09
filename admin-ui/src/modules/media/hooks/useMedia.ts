import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IMediaQuery, IMediaQueryVariables } from '../../../gql/types';
import MediaFragment from '../fragments/MediaFragment';

const MediaQuery = gql`
  query Media($mediaId: ID!) {
    media(mediaId: $mediaId) {
      ...MediaFragment
    }
  }
  ${MediaFragment}
`;

const useMedia = ({ mediaId = null }: IMediaQueryVariables) => {
  const { data, loading, error } = useQuery<IMediaQuery, IMediaQueryVariables>(MediaQuery, {
    skip: !mediaId,
    variables: { mediaId },
  });
  const media = data?.media;

  return {
    media,
    loading,
    error,
  };
};

export default useMedia;
