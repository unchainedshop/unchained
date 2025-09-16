import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ISmartContractStandardsQuery,
  ISmartContractStandardsQueryVariables,
} from '../../../gql/types';

const SmartContractStandardsQuery = gql`
  query SmartContractStandards {
    smartContractStandards: __type(name: "SmartContractStandard") {
      options: enumValues {
        value: name
        label: name
      }
    }
  }
`;

const useSmartContractStandards = () => {
  const { data, loading, error } = useQuery<
    ISmartContractStandardsQuery,
    ISmartContractStandardsQueryVariables
  >(SmartContractStandardsQuery);

  const smartContractStandards = data?.smartContractStandards?.options || [];

  return {
    smartContractStandards,
    loading,
    error,
  };
};

export default useSmartContractStandards;
