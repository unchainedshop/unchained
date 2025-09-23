import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveAssortmentMutation,
  IRemoveAssortmentMutationVariables,
} from '../../../gql/types';

const RemoveAssortmentMutation = gql`
  mutation RemoveAssortment($assortmentId: ID!) {
    removeAssortment(assortmentId: $assortmentId) {
      _id
    }
  }
`;

const useRemoveAssortment = () => {
  const [removeAssortmentMutation] = useMutation<
    IRemoveAssortmentMutation,
    IRemoveAssortmentMutationVariables
  >(RemoveAssortmentMutation);

  const removeAssortment = async ({
    assortmentId,
  }: IRemoveAssortmentMutationVariables) => {
    return removeAssortmentMutation({
      variables: { assortmentId },
      refetchQueries: ['Assortments', 'Assortment', 'ShopStatus', 'ShopInfo'],
    });
  };

  return {
    removeAssortment,
  };
};

export default useRemoveAssortment;
