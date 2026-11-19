import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const SuspendEnrollmentMutation = gql`
  mutation SuspendEnrollment($enrollmentId: ID!, $resumeAt: DateTimeISO) {
    suspendEnrollment(enrollmentId: $enrollmentId, resumeAt: $resumeAt) {
      _id
    }
  }
`;

const useSuspendEnrollment = () => {
  const [suspendEnrollmentMutation] = useMutation(SuspendEnrollmentMutation);

  const suspendEnrollment = async ({
    enrollmentId,
    resumeAt,
  }: {
    enrollmentId: string;
    resumeAt?: string | null;
  }) => {
    return suspendEnrollmentMutation({
      variables: { enrollmentId, resumeAt },
      refetchQueries: ['Enrollments', 'Enrollment'],
    });
  };

  return { suspendEnrollment };
};

export default useSuspendEnrollment;
