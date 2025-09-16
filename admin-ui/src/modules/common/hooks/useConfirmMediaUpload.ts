import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IConfirmMediaUploadMutation,
  IConfirmMediaUploadMutationVariables,
} from '../../../gql/types';

const ConfirmMediaUploadMutation = gql`
  mutation ConfirmMediaUpload(
    $mediaUploadTicketId: ID!
    $size: Int!
    $type: String!
  ) {
    confirmMediaUpload(
      mediaUploadTicketId: $mediaUploadTicketId
      size: $size
      type: $type
    ) {
      _id
      name
      type
      size
      url
    }
  }
`;

const useConfirmMediaUpload = (options = {}) => {
  const [confirmMediaUploadMutation] = useMutation<
    IConfirmMediaUploadMutation,
    IConfirmMediaUploadMutationVariables
  >(ConfirmMediaUploadMutation, options);

  const confirmMediaUpload = async ({ mediaUploadTicketId, size, type }) => {
    return confirmMediaUploadMutation({
      variables: { mediaUploadTicketId, size, type },
    });
  };

  return {
    confirmMediaUpload,
  };
};

export default useConfirmMediaUpload;
