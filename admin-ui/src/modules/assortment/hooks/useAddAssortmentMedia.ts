import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import useConfirmMediaUpload from '../../common/hooks/useConfirmMediaUpload';
import PUTMedia from '../../common/utils/PUTMedia';
import {
  IPrepareAssortmentMediaUploadMutation,
  IPrepareAssortmentMediaUploadMutationVariables,
} from '../../../gql/types';

const PrepareAssortmentMediaUploadMutation = gql`
  mutation PrepareAssortmentMediaUpload(
    $mediaName: String!
    $assortmentId: ID!
  ) {
    prepareAssortmentMediaUpload(
      mediaName: $mediaName
      assortmentId: $assortmentId
    ) {
      _id
      putURL
      expires
    }
  }
`;

const useAddAssortmentMedia = () => {
  const [prepareAssortmentMediaUploadMutation] = useMutation<
    IPrepareAssortmentMediaUploadMutation,
    IPrepareAssortmentMediaUploadMutationVariables
  >(PrepareAssortmentMediaUploadMutation);
  const { confirmMediaUpload } = useConfirmMediaUpload({
    refetchQueries: ['Assortment'],
  });
  const addAssortmentMedia = async ({ assortmentId, media }) => {
    const { data } = await prepareAssortmentMediaUploadMutation({
      variables: { assortmentId, mediaName: media.name },
    });

    const { prepareAssortmentMediaUpload } = data;
    await PUTMedia(media, prepareAssortmentMediaUpload.putURL);
    await confirmMediaUpload({
      mediaUploadTicketId: prepareAssortmentMediaUpload._id,
      size: media?.size,
      type: media?.type,
    });
  };
  return {
    addAssortmentMedia,
  };
};

export default useAddAssortmentMedia;
