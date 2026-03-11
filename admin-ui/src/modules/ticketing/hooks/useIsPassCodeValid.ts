import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';
import {
  IIsPassCodeValidQuery,
  IIsPassCodeValidQueryVariables,
} from '../../../gql/types';

const IsPassCodeValidQuery = gql`
  query IsPassCodeValid($productId: ID) {
    isPassCodeValid(productId: $productId)
  }
`;

const useIsPassCodeValid = () => {
  const [checkPassCode, { data, loading, error }] = useLazyQuery<
    IIsPassCodeValidQuery,
    IIsPassCodeValidQueryVariables
  >(IsPassCodeValidQuery, {
    fetchPolicy: 'network-only',
  });

  const validatePassCode = async (passCode: string, productId?: string) => {
    window.sessionStorage.setItem('gate-passcode', passCode);
    const result = await checkPassCode({
      variables: { productId },
    });
    if (!result.data?.isPassCodeValid) {
      window.sessionStorage.removeItem('gate-passcode');
    }
    return result.data?.isPassCodeValid || false;
  };

  const clearPassCode = () => {
    window.sessionStorage.removeItem('gate-passcode');
  };

  return {
    validatePassCode,
    clearPassCode,
    isValid: data?.isPassCodeValid || false,
    loading,
    error,
  };
};

export default useIsPassCodeValid;
