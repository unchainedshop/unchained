import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const SuspendEnrollmentMutation = gql`
  mutation SuspendEnrollment($enrollmentId: ID!) {
    suspendEnrollment(enrollmentId: $enrollmentId) {
      _id
    }
  }
`;

const useSuspendEnrollment = () => {
  const [suspendEnrollmentMutation] = useMutation(SuspendEnrollmentMutation);

  const suspendEnrollment = async ({
    enrollmentId,
  }: {
    enrollmentId: string;
  }) => {
    return suspendEnrollmentMutation({
      variables: { enrollmentId },
      refetchQueries: ['Enrollments', 'Enrollment'],
    });
  };

  return { suspendEnrollment };
};

export default useSuspendEnrollment;
