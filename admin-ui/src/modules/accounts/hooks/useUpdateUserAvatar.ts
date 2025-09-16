import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import useConfirmMediaUpload from '../../common/hooks/useConfirmMediaUpload';
import PUTMedia from '../../common/utils/PUTMedia';
import {
  IPrepareUserAvatarUploadMutation,
  IPrepareUserAvatarUploadMutationVariables,
} from '../../../gql/types';
const PrepareUserAvatarUploadMutation = gql`
  mutation PrepareUserAvatarUpload($mediaName: String!, $userId: ID) {
    prepareUserAvatarUpload(mediaName: $mediaName, userId: $userId) {
      _id
      putURL
      expires
    }
  }
`;

const useUpdateUserAvatar = () => {
  const [prepareUserAvatarUploadMutation] = useMutation<
    IPrepareUserAvatarUploadMutation,
    IPrepareUserAvatarUploadMutationVariables
  >(PrepareUserAvatarUploadMutation);
  const { confirmMediaUpload } = useConfirmMediaUpload({
    refetchQueries: ['User', 'CurrentUser'],
  });

  const updateUserAvatar = async ({ avatar, userId = null }) => {
    const { data } = await prepareUserAvatarUploadMutation({
      variables: {
        mediaName: avatar.name,
        userId,
      },
    });
    const { prepareUserAvatarUpload } = data;
    await PUTMedia(avatar, prepareUserAvatarUpload.putURL);
    await confirmMediaUpload({
      mediaUploadTicketId: prepareUserAvatarUpload._id,
      size: avatar.size,
      type: avatar.type,
    });
  };

  return {
    updateUserAvatar,
  };
};

export default useUpdateUserAvatar;
