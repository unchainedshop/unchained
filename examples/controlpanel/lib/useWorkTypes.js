import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';

export const WorkTypesQuery = gql`
  query registeredWorkTypes {
        workTypes{
          _id
        }
  }
`;

const useWorkTypes = () => {
  const { data, loading } = useQuery(WorkTypesQuery);

  return {
    loading,
    workTypes : data?.workTypes || []
  };
};

export default useWorkTypes;
