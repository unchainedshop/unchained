import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAddWorkMutation,
  IAddWorkMutationVariables,
} from '../../../gql/types';

const AddWorkMutation = gql`
  mutation AddWork(
    $type: WorkType!
    $priority: Int! = 0
    $input: JSON
    $originalWorkId: ID
    $scheduled: Timestamp
    $retries: Int! = 20
  ) {
    addWork(
      type: $type
      priority: $priority
      input: $input
      originalWorkId: $originalWorkId
      scheduled: $scheduled
      retries: $retries
    ) {
      _id
    }
  }
`;

const useAddWork = () => {
  const [addWorkMutation] = useMutation<
    IAddWorkMutation,
    IAddWorkMutationVariables
  >(AddWorkMutation);

  const addWork = async ({
    type,
    priority,
    input,
    originalWorkId,
    scheduled = null,
    retries,
  }: IAddWorkMutationVariables) => {
    return addWorkMutation({
      variables: {
        type,
        priority,
        input,
        originalWorkId,
        scheduled,
        retries,
      },
      refetchQueries: ['WorkQueue'],
    });
  };

  return {
    addWork,
  };
};

export default useAddWork;
