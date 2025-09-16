import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveWeb3AddressMutation,
  IRemoveWeb3AddressMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const RemoveWeb3AddressMutation = gql`
  mutation RemoveWeb3Address($address: String!) {
    removeWeb3Address(address: $address) {
      ...UserFragment
    }
  }
  ${UserFragment}
`;

const useRemoveWeb3Address = () => {
  const [removeWeb3AddressMutation] = useMutation<
    IRemoveWeb3AddressMutation,
    IRemoveWeb3AddressMutationVariables
  >(RemoveWeb3AddressMutation);
  const removeWeb3Address = async ({
    address,
  }: IRemoveWeb3AddressMutationVariables) => {
    return removeWeb3AddressMutation({
      variables: {
        address,
      },
    });
  };

  return {
    removeWeb3Address,
  };
};

export default useRemoveWeb3Address;
