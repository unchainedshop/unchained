import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IWorkTypesQuery, IWorkTypesQueryVariables } from '../../../gql/types';

const WorkTypesQuery = gql`
  query WorkTypes {
    registeredWorkTypes: __type(name: "WorkType") {
      options: enumValues {
        value: name
        label: name
      }
    }
  }
`;

const useRegisteredWorkTypes = () => {
  const { data, loading, error } = useQuery<
    IWorkTypesQuery,
    IWorkTypesQueryVariables
  >(WorkTypesQuery);

  const workTypes = data?.registeredWorkTypes?.options || [];

  return {
    workTypes,
    loading,
    error,
  };
};

export default useRegisteredWorkTypes;
