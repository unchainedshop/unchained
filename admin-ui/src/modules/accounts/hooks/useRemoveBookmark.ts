import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveBookmarkMutation,
  IRemoveBookmarkMutationVariables,
} from '../../../gql/types';

const RemoveBookmarkMutation = gql`
  mutation RemoveBookmark($bookmarkId: ID!) {
    removeBookmark(bookmarkId: $bookmarkId) {
      _id
    }
  }
`;

const useRemoveBookmark = () => {
  const [removeBookmarkMutation] = useMutation<
    IRemoveBookmarkMutation,
    IRemoveBookmarkMutationVariables
  >(RemoveBookmarkMutation);

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
