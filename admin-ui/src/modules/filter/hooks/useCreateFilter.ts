import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateFilterMutation,
  ICreateFilterMutationVariables,
} from '../../../gql/types';
import FilterFragment from '../fragments/FilterFragment';

const CreateFilterMutation = gql`
  mutation CreateFilter(
    $filter: CreateFilterInput!
    $texts: [FilterTextInput!]!
  ) {
    createFilter(filter: $filter, texts: $texts) {
      ...FilterFragment
    }
  }
  ${FilterFragment}
`;

const useCreateFilter = () => {
  const [createFilterMutation, { data, loading, error }] = useMutation<
    ICreateFilterMutation,
    ICreateFilterMutationVariables
  >(CreateFilterMutation);

  const createFilter = async ({
    filter: { key, type, options },
    texts,
  }: ICreateFilterMutationVariables) => {
    return createFilterMutation({
      variables: { filter: { key, type, options }, texts },
    });
  };
  const newFilter = data?.createFilter;
  return {
    createFilter,
    newFilter,
    loading,
    error,
  };
};

export default useCreateFilter;
