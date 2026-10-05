import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const RemoveBookmarkMutation = gql`
  mutation RemoveBookmark($bookmarkId: ID!) {
    removeBookmark(bookmarkId: $bookmarkId) {
      _id
    }
  }
`;

const useRemoveBookmark = () => {
  const [removeBookmarkMutation] = useMutation(RemoveBookmarkMutation);

  const removeBookmark = async (bookmarkId: string) => {
    return removeBookmarkMutation({
      variables: {
        bookmarkId,
      },
      refetchQueries: ['UserBookmarks'],
    });
  };

  return {
    removeBookmark,
  };
};

export default useRemoveBookmark;
