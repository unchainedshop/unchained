import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
const DeleteUserMutation = gql`
  mutation DeleteUser($userId: ID) {
    removeUser(userId: $userId) {
      _id
    }
  }
`;
const useDeleteUser = () => {
  const [deleteUserMutation] = useMutation(DeleteUserMutation);

  const deleteUser = async (userId = undefined) => {
    return deleteUserMutation({
      variables: {
        userId,
      },
    });
  };

  return {
    deleteUser,
  };
};

export default useDeleteUser;
