import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IValidateResetPasswordTokenQuery,
  IValidateResetPasswordTokenQueryVariables,
} from '../../../gql/types';

const VALIDATE_RESET_PASSWORD_TOKEN_QUERY = gql`
  query ValidateResetPasswordToken($token: String!) {
    validateResetPasswordToken(token: $token)
  }
`;

const useValidateResetPasswordToken = ({ token }) => {
  const { data, loading, error, previousData } = useQuery<
    IValidateResetPasswordTokenQuery,
    IValidateResetPasswordTokenQueryVariables
  >(VALIDATE_RESET_PASSWORD_TOKEN_QUERY, {
    skip: !token,
    variables: {
      token,
    },
    fetchPolicy: 'network-only',
  });

  return {
    loading,
    error,
    isValid:
      previousData?.validateResetPasswordToken ||
      data?.validateResetPasswordToken,
  };
};

export default useValidateResetPasswordToken;
