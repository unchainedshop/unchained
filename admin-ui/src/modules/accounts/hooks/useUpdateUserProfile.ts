import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateUserProfileMutation,
  IUpdateUserProfileMutationVariables,
} from '../../../gql/types';

const UpdateUserProfileMutation = gql`
  mutation UpdateUserProfile($profile: UserProfileInput!, $userId: ID) {
    updateUserProfile(profile: $profile, userId: $userId) {
      _id
    }
  }
`;

const useUpdateUserProfile = () => {
  const [updateUserProfileMutation] = useMutation<
    IUpdateUserProfileMutation,
    IUpdateUserProfileMutationVariables
  >(UpdateUserProfileMutation);

  const updateUserProfile = async ({
    profile,
    userId = null,
  }: IUpdateUserProfileMutationVariables) => {
    return updateUserProfileMutation({
      variables: {
        profile,
        userId,
      },
      refetchQueries: ['UserPermissions', 'User', 'CurrentUser'],
    });
  };

  return {
    updateUserProfile,
  };
};

export default useUpdateUserProfile;
