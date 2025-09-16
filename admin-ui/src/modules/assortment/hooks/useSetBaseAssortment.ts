import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ISetBaseAssortmentMutation,
  ISetBaseAssortmentMutationVariables,
} from '../../../gql/types';

const SetBaseAssortmentMutation = gql`
  mutation SetBaseAssortment($assortmentId: ID!) {
    setBaseAssortment(assortmentId: $assortmentId) {
      _id
      isBase
    }
  }
`;

const useSetBaseAssortment = () => {
  const [setBaseAssortmentMutation] = useMutation<
    ISetBaseAssortmentMutation,
    ISetBaseAssortmentMutationVariables
  >(SetBaseAssortmentMutation);

  const setBaseAssortment = async ({
    assortmentId,
  }: ISetBaseAssortmentMutationVariables) => {
    return setBaseAssortmentMutation({
      variables: { assortmentId },
      refetchQueries: ['Assortment'],
    });
  };

  return {
    setBaseAssortment,
  };
};

export default useSetBaseAssortment;
