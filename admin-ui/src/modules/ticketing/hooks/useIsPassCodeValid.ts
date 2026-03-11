import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAuthenticateGateMutation,
  IAuthenticateGateMutationVariables,
  IDeauthenticateGateMutation,
  IDeauthenticateGateMutationVariables,
} from '../../../gql/types';

const AuthenticateGateMutation = gql`
  mutation AuthenticateGate($passCode: String!) {
    authenticateGate(passCode: $passCode)
  }
`;

const DeauthenticateGateMutation = gql`
  mutation DeauthenticateGate {
    deauthenticateGate
  }
`;

const useIsPassCodeValid = () => {
  const [authenticateGate, { loading: authLoading }] = useMutation<
    IAuthenticateGateMutation,
    IAuthenticateGateMutationVariables
  >(AuthenticateGateMutation);
  const [deauthenticateGate, { loading: deauthLoading }] = useMutation<
    IDeauthenticateGateMutation,
    IDeauthenticateGateMutationVariables
  >(DeauthenticateGateMutation);

  const validatePassCode = async (passCode: string) => {
    try {
      const result = await authenticateGate({
        variables: { passCode },
      });
      return result.data?.authenticateGate || false;
    } catch {
      return false;
    }
  };

  const clearPassCode = async () => {
    try {
      await deauthenticateGate();
    } catch {
      // ignore
    }
  };

  return {
    validatePassCode,
    clearPassCode,
    loading: authLoading || deauthLoading,
  };
};

export default useIsPassCodeValid;
