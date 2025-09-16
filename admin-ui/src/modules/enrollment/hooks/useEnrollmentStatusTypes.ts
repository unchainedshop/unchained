import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IEnrollmentStatusQuery,
  IEnrollmentStatusQueryVariables,
} from '../../../gql/types';

const EnrollmentStatusTypes = gql`
  query EnrollmentStatus {
    enrollmentStatusTypes: __type(name: "EnrollmentStatus") {
      options: enumValues {
        value: name
        label: description
      }
    }
  }
`;

const useEnrollmentStatusTypes = () => {
  const { data, loading, error } = useQuery<
    IEnrollmentStatusQuery,
    IEnrollmentStatusQueryVariables
  >(EnrollmentStatusTypes);

  const enrollmentStatusTypes = data?.enrollmentStatusTypes?.options || [];

  return {
    enrollmentStatusTypes,
    loading,
    error,
  };
};

export default useEnrollmentStatusTypes;
