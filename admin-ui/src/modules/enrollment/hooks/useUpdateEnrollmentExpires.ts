import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateEnrollmentExpiresMutation,
  IUpdateEnrollmentExpiresMutationVariables,
} from '../../../gql/types';

const UpdateEnrollmentExpiresMutation = gql`
  mutation UpdateEnrollmentExpires($enrollmentId: ID!, $expires: DateTimeISO) {
    updateEnrollment(enrollmentId: $enrollmentId, expires: $expires) {
      _id
      expires
    }
  }
`;

const useUpdateEnrollmentExpires = () => {
  const [updateEnrollmentExpiresMutation] = useMutation<
    IUpdateEnrollmentExpiresMutation,
    IUpdateEnrollmentExpiresMutationVariables
  >(UpdateEnrollmentExpiresMutation);

  const updateEnrollmentExpires = async ({
    enrollmentId,
    expires,
  }: IUpdateEnrollmentExpiresMutationVariables) => {
    return updateEnrollmentExpiresMutation({
      variables: { enrollmentId, expires },
      refetchQueries: ['Enrollments', 'Enrollment'],
    });
  };

  return {
    updateEnrollmentExpires,
  };
};

export default useUpdateEnrollmentExpires;
