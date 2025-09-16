import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateUserProfileMutation,
  IUpdateUserProfileMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const UpdateUserProfileMutation = gql`
  mutation UpdateUserProfile($profile: UserProfileInput!, $userId: ID) {
    updateUserProfile(profile: $profile, userId: $userId) {
      ...UserFragment
    }
  }
  ${UserFragment}
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
    });
  };

  return {
    updateUserProfile,
  };
};

export default useUpdateUserProfile;
