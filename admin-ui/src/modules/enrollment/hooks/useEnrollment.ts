import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IEnrollmentQuery,
  IEnrollmentQueryVariables,
} from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import EnrollmentDetailFragment from '../fragments/EnrollmentDetailFragment';

const GetEnrollmentQuery = (inlineFragment = '') => gql`
  query Enrollment($enrollmentId: ID!) {
    enrollment(enrollmentId: $enrollmentId) {
      ...EnrollmentDetailFragment
      ${inlineFragment}

    }
  }
  ${EnrollmentDetailFragment}
`;

const useEnrollment = ({ enrollmentId = null }: IEnrollmentQueryVariables) => {
  const { customProperties } = useUnchainedContext();
  const { data, loading, error } = useQuery<
    IEnrollmentQuery,
    IEnrollmentQueryVariables
  >(GetEnrollmentQuery(customProperties?.Enrollment), {
    skip: !enrollmentId,
    variables: { enrollmentId },
  });
  const enrollment = data?.enrollment;

  return {
    enrollment,
    loading,
    error,
  };
};

export default useEnrollment;
