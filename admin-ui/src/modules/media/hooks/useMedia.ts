import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import MediaFragment from '../fragments/MediaFragment';

interface IMediaQuery {
  media: {
    _id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  } | null;
}

const MediaQuery = gql`
  query Media($mediaId: ID!) {
    media(mediaId: $mediaId) {
      ...MediaFragment
    }
  }
  ${MediaFragment}
`;

const useMedia = ({ mediaId = null }) => {
  const { data, loading, error } = useQuery<IMediaQuery>(MediaQuery, {
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
