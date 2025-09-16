import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAddWeb3AddressMutation,
  IAddWeb3AddressMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const AddWeb3AddressMutation = gql`
  mutation AddWeb3Address($address: String!) {
    addWeb3Address(address: $address) {
      ...UserFragment
    }
  }
  ${UserFragment}
`;

const useAddWeb3Address = () => {
  const [addWeb3AddressMutation] = useMutation<
    IAddWeb3AddressMutation,
    IAddWeb3AddressMutationVariables
  >(AddWeb3AddressMutation);
  const addWeb3Address = async ({
    address,
  }: IAddWeb3AddressMutationVariables) => {
    return addWeb3AddressMutation({
      variables: {
        address,
      },
    });
  };

  return {
    addWeb3Address,
  };
};

export default useAddWeb3Address;
