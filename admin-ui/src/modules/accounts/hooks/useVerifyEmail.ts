import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IVerifyEmailMutation,
  IVerifyEmailMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const VerifyEmailMutation = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      _id
      tokenExpires
      user {
        ...UserFragment
      }
    }
  }
  ${UserFragment}
`;

const useVerifyEmail = () => {
  const [verifyEmailMutation, { client }] = useMutation<
    IVerifyEmailMutation,
    IVerifyEmailMutationVariables
  >(VerifyEmailMutation);

  const verifyEmail = async ({ token }: IVerifyEmailMutationVariables) => {
    const result = await verifyEmailMutation({
      variables: { token },
    });
    await client.resetStore();
    return result;
  };

  return {
    verifyEmail,
  };
};

export default useVerifyEmail;
