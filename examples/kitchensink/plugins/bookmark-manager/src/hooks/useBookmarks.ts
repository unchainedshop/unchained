import { useQuery } from '@apollo/client/react';
import BookmarkFragment from '../fragments/BookmarkFragment';
import { gql } from '@apollo/client';
const MyBookmarksQuery = gql`
  query PluginMyBookmarks {
    me {
      _id
      username
      name
      primaryEmail {
        address
      }
      bookmarks {
        ...BookmarkFragment
      }
    }
  }
  ${BookmarkFragment}
`;

const useBookmarks = () => {
  const { data, loading, error, refetch } = useQuery<any>(MyBookmarksQuery, {
    fetchPolicy: 'cache-and-network',
  });

  const user = data?.me;
  const bookmarks = user?.bookmarks || [];

  return {
    user,
    bookmarks,
    loading,
    error,
    refetch,
  };
};

export default useBookmarks;
export { MyBookmarksQuery };
