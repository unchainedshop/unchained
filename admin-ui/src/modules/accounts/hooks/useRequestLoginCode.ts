import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRequestLoginCodeMutation,
  IRequestLoginCodeMutationVariables,
} from '../../../gql/types';

const RequestLoginCodeMutation = gql`
  mutation RequestLoginCode($email: String!) {
    requestLoginCode(email: $email)
  }
`;

const useRequestLoginCode = () => {
  const [requestLoginCodeMutation] = useMutation<
    IRequestLoginCodeMutation,
    IRequestLoginCodeMutationVariables
  >(RequestLoginCodeMutation);

  const requestLoginCode = async ({
    email,
  }: IRequestLoginCodeMutationVariables) => {
    return requestLoginCodeMutation({ variables: { email } });
  };

  return {
    requestLoginCode,
  };
};

export default useRequestLoginCode;
