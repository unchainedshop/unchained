import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IVerifyWeb3AddressMutation,
  IVerifyWeb3AddressMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const VerifyWeb3AddressMutation = gql`
  mutation VerifyWeb3Address($address: String!, $hash: String!) {
    verifyWeb3Address(address: $address, hash: $hash) {
      ...UserFragment
    }
  }
  ${UserFragment}
`;

const useVerifyWeb3Address = () => {
  const [verifyWeb3AddressMutation] = useMutation<
    IVerifyWeb3AddressMutation,
    IVerifyWeb3AddressMutationVariables
  >(VerifyWeb3AddressMutation);
  const verifyWeb3Address = async ({
    address,
    hash,
  }: IVerifyWeb3AddressMutationVariables) => {
    return verifyWeb3AddressMutation({
      variables: {
        address,
        hash,
      },
    });
  };

  return {
    verifyWeb3Address,
  };
};

export default useVerifyWeb3Address;
