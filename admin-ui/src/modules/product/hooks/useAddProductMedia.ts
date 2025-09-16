import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import PUTMedia from '../../common/utils/PUTMedia';
import useConfirmMediaUpload from '../../common/hooks/useConfirmMediaUpload';
import {
  IPrepareProductMediaUploadMutation,
  IPrepareProductMediaUploadMutationVariables,
} from '../../../gql/types';

const PrepareProductMediaUploadMutation = gql`
  mutation PrepareProductMediaUpload($mediaName: String!, $productId: ID!) {
    prepareProductMediaUpload(mediaName: $mediaName, productId: $productId) {
      _id
      putURL
      expires
    }
  }
`;

const useAddProductMedia = () => {
  const [prepareProductMediaUploadMutation] = useMutation<
    IPrepareProductMediaUploadMutation,
    IPrepareProductMediaUploadMutationVariables
  >(PrepareProductMediaUploadMutation);
  const { confirmMediaUpload } = useConfirmMediaUpload({
    refetchQueries: ['Product'],
  });

  const addProductMedia = async ({ productId, media }) => {
    const { data } = await prepareProductMediaUploadMutation({
      variables: { productId, mediaName: media.name },
    });
    const { prepareProductMediaUpload } = data;
    await PUTMedia(media, prepareProductMediaUpload.putURL);
    return confirmMediaUpload({
      mediaUploadTicketId: prepareProductMediaUpload._id,
      size: media?.size,
      type: media.type,
    });
  };

  return {
    addProductMedia,
  };
};

export default useAddProductMedia;
