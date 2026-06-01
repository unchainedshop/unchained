import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const StatusTypesQuery = gql`
  query StatusTypes($enumName: String!) {
    statusTypes: __type(name: $enumName) {
      options: enumValues {
        value: name
        label: description
      }
    }
  }
`;

type StatusTypesData = {
  statusTypes: { options: { value: string; label: string }[] } | null;
};

const useStatusTypes = (enumName: string) => {
  const { data, loading, error } = useQuery<StatusTypesData>(StatusTypesQuery, {
    variables: { enumName },
  });

  const statusTypes = data?.statusTypes?.options || [];

  return { statusTypes, loading, error };
};

export default useStatusTypes;
