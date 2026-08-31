import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

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
  const [authenticateGate, { loading: authLoading }] = useMutation(
    AuthenticateGateMutation,
  );
  const [deauthenticateGate, { loading: deauthLoading }] = useMutation(
    DeauthenticateGateMutation,
  );

  const validatePassCode = async (passCode: string) => {
    try {
      const result = await authenticateGate({
        variables: { passCode },
      });
      return (result.data as any)?.authenticateGate || false;
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
