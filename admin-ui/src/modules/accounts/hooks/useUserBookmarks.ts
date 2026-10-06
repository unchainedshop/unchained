import {
  IUserBookmarksQuery,
  IUserBookmarksQueryVariables,
} from '../../../gql/types';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const UserBookmarksQuery = gql`
  query UserBookmarks($userId: ID!) {
    user(userId: $userId) {
      _id
      bookmarks {
        _id
        created
        product {
          _id
          texts {
            _id
            title
          }
          media {
            _id
            file {
              _id
              url
            }
          }
        }
      }
    }
  }
`;

const useUserBookmarks = ({ userId = null }: { userId?: string }) => {
  const { data, loading, error } = useQuery<
    IUserBookmarksQuery,
    IUserBookmarksQueryVariables
  >(UserBookmarksQuery, {
    skip: !userId,
    variables: { userId },
  });
  const bookmarks = data?.user?.bookmarks || [];

  return {
    bookmarks,
    loading,
    error,
  };
};

export default useUserBookmarks;
