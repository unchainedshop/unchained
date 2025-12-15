import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAssortmentTextInput,
  ICreateAssortmentInput,
  ICreateAssortmentMutation,
  ICreateAssortmentMutationVariables,
} from '../../../gql/types';

const CreateAssortmentMutation = gql`
  mutation CreateAssortment(
    $assortment: CreateAssortmentInput!
    $texts: [AssortmentTextInput!]
  ) {
    createAssortment(assortment: $assortment, texts: $texts) {
      _id
    }
  }
`;

const useCreateAssortment = () => {
  const [createAssortmentMutation, { data, error, loading }] = useMutation<
    ICreateAssortmentMutation,
    ICreateAssortmentMutationVariables
  >(CreateAssortmentMutation);

  const createAssortment = async ({
    isRoot = false,
    tags = [],
    texts,
  }: ICreateAssortmentInput & { texts: IAssortmentTextInput[] }) => {
    return createAssortmentMutation({
      variables: { assortment: { isRoot, tags }, texts },
      refetchQueries: [
        'Assortments',
        'TranslatedAssortmentTexts',
        'ShopStatus',
        'ShopInfo',
      ],
    });
  };
  const newAssortment = data?.createAssortment;
  return {
    createAssortment,
    loading,
    newAssortment,
    error,
  };
};

export default useCreateAssortment;
