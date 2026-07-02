import { useMutation } from '@apollo/client/react';
import { MyBookmarksQuery } from './useBookmarks';
import { gql } from '@apollo/client';

const RemoveBookmarkMutation = gql`
  mutation PluginRemoveBookmark($bookmarkId: ID!) {
    removeBookmark(bookmarkId: $bookmarkId) {
      _id
    }
  }
`;

const useRemoveBookmark = () => {
  const [removeBookmarkMutation, { loading }] = useMutation(RemoveBookmarkMutation);

  const removeBookmark = async ({ bookmarkId }: { bookmarkId: string }) => {
    return removeBookmarkMutation({
      variables: { bookmarkId },
      refetchQueries: [{ query: MyBookmarksQuery }],
    });
  };

  return {
    removeBookmark,
    loading,
  };
};

export default useRemoveBookmark;
