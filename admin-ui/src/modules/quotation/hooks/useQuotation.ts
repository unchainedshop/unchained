import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IQuotationQuery, IQuotationQueryVariables } from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import QuotationDetailFragment from '../fragments/QuotationDetailFragment';

const GetQuotationsQuery = (inlineFragment = '') => gql`
  query Quotation($quotationId: ID!) {
    quotation(quotationId: $quotationId) {
      _id
      ...QuotationDetailFragment
      ${inlineFragment}
    }
    quotationsCount
  }
  ${QuotationDetailFragment}
`;

const useQuotation = ({ quotationId }: IQuotationQueryVariables) => {
  const { customProperties } = useUnchainedContext();
  const { data, loading, error } = useQuery<
    IQuotationQuery,
    IQuotationQueryVariables
  >(GetQuotationsQuery(customProperties?.Quotation), {
    skip: !quotationId,
    variables: { quotationId },
  });

  return {
    quotation: data?.quotation,

    loading,
    error,
  };
};

export default useQuotation;
