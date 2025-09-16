import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ITerminateEnrollmentMutation,
  ITerminateEnrollmentMutationVariables,
} from '../../../gql/types';

const TerminateEnrollmentMutation = gql`
  mutation TerminateEnrollment($enrollmentId: ID!) {
    terminateEnrollment(enrollmentId: $enrollmentId) {
      _id
    }
  }
`;

const useTerminateEnrollment = () => {
  const [terminateEnrollmentMutation] = useMutation<
    ITerminateEnrollmentMutation,
    ITerminateEnrollmentMutationVariables
  >(TerminateEnrollmentMutation);

  const terminateEnrollment = async ({
    enrollmentId,
  }: ITerminateEnrollmentMutationVariables) => {
    return terminateEnrollmentMutation({
      variables: { enrollmentId },
      refetchQueries: ['Enrollments', 'Enrollment'],
    });
  };

  return {
    terminateEnrollment,
  };
};

export default useTerminateEnrollment;
