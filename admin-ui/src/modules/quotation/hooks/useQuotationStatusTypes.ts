import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IQuotationStatusQuery,
  IQuotationStatusQueryVariables,
} from '../../../gql/types';

const QuotationStatusTypesQuery = gql`
  query QuotationStatus {
    quotationStatusType: __type(name: "QuotationStatus") {
      options: enumValues {
        value: name
        label: description
      }
    }
  }
`;

const useQuotationStatusTypes = () => {
  const { data, loading, error } = useQuery<
    IQuotationStatusQuery,
    IQuotationStatusQueryVariables
  >(QuotationStatusTypesQuery);

  const quotationStatusTypes = data?.quotationStatusType?.options || [];

  return {
    quotationStatusTypes,
    loading,
    error,
  };
};

export default useQuotationStatusTypes;
