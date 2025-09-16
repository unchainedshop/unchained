import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAllocateWorkMutation,
  IAllocateWorkMutationVariables,
} from '../../../gql/types';

const AllocateWorkMutation = gql`
  mutation AllocateWork($types: [WorkType], $worker: String) {
    allocateWork(types: $types, worker: $worker) {
      _id
    }
  }
`;

const useAllocateWork = () => {
  const [allocateWorkMutation] = useMutation<
    IAllocateWorkMutation,
    IAllocateWorkMutationVariables
  >(AllocateWorkMutation);

  const allocateWork = async ({
    types,
    worker,
  }: IAllocateWorkMutationVariables) => {
    return allocateWorkMutation({
      variables: {
        types,
        worker,
      },
      refetchQueries: ['WorkQueue'],
    });
  };

  return {
    allocateWork,
  };
};

export default useAllocateWork;
