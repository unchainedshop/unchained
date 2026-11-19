import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ITerminateEnrollmentMutation,
  ITerminateEnrollmentMutationVariables,
} from '../../../gql/types';

const TerminateEnrollmentMutation = gql`
  mutation TerminateEnrollment(
    $enrollmentId: ID!
    $reason: EnrollmentTerminationReason
    $comment: String
  ) {
    terminateEnrollment(
      enrollmentId: $enrollmentId
      reason: $reason
      comment: $comment
    ) {
      _id
      status
      expires
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
    reason,
    comment,
  }: ITerminateEnrollmentMutationVariables) => {
    return terminateEnrollmentMutation({
      variables: { enrollmentId, reason, comment },
      refetchQueries: ['Enrollments', 'Enrollment'],
    });
  };

  return {
    terminateEnrollment,
  };
};

export default useTerminateEnrollment;
