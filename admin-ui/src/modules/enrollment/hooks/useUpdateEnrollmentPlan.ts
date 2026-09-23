import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const UpdateEnrollmentPlanMutation = gql`
  mutation UpdateEnrollmentPlan(
    $enrollmentId: ID!
    $plan: EnrollmentPlanInput!
  ) {
    updateEnrollment(enrollmentId: $enrollmentId, plan: $plan) {
      _id
      status
      plan {
        product {
          _id
          texts {
            _id
            title
          }
        }
        quantity
        configuration {
          key
          value
        }
      }
    }
  }
`;

const useUpdateEnrollmentPlan = () => {
  const [updateEnrollmentPlanMutation] = useMutation(
    UpdateEnrollmentPlanMutation,
  );

  const updateEnrollmentPlan = async ({ enrollmentId, plan }) => {
    return updateEnrollmentPlanMutation({
      variables: { enrollmentId, plan },
      refetchQueries: ['Enrollments', 'Enrollment'],
    });
  };

  return { updateEnrollmentPlan };
};

export default useUpdateEnrollmentPlan;
