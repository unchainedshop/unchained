import { useMutation } from '@apollo/client/react';
import {} from '@unchainedshop/admin-ui/plugins';
import BookmarkFragment from '../fragments/BookmarkFragment';
import { MyBookmarksQuery } from './useBookmarks';
import { gql } from '@apollo/client';

const BookmarkProductMutation = gql`
  mutation PluginBookmarkProduct($productId: ID!, $bookmarked: Boolean!) {
    bookmark(productId: $productId, bookmarked: $bookmarked) {
      ...BookmarkFragment
    }
  }
  ${BookmarkFragment}
`;

const useBookmarkProduct = () => {
  const [bookmarkProductMutation, { loading }] = useMutation(BookmarkProductMutation);

  const bookmarkProduct = async ({ productId }: { productId: string }) => {
    return bookmarkProductMutation({
      variables: { productId, bookmarked: true },
      refetchQueries: [{ query: MyBookmarksQuery }],
    });
  };

  return {
    bookmarkProduct,
    loading,
  };
};

export default useBookmarkProduct;
