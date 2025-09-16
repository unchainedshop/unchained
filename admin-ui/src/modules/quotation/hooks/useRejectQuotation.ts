import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRejectQuotationMutation,
  IRejectQuotationMutationVariables,
} from '../../../gql/types';
import QuotationDetailFragment from '../fragments/QuotationDetailFragment';

const RejectQuotationMutation = gql`
  mutation RejectQuotation($quotationId: ID!, $quotationContext: JSON) {
    rejectQuotation(
      quotationId: $quotationId
      quotationContext: $quotationContext
    ) {
      ...QuotationDetailFragment
    }
  }
  ${QuotationDetailFragment}
`;

const useRejectQuotation = () => {
  const [rejectQuotationMutation] = useMutation<
    IRejectQuotationMutation,
    IRejectQuotationMutationVariables
  >(RejectQuotationMutation);

  const rejectQuotation = async ({
    quotationId = null,
    quotationContext = {},
  }: IRejectQuotationMutationVariables) => {
    return rejectQuotationMutation({
      variables: { quotationId, quotationContext },
    });
  };

  return {
    rejectQuotation,
  };
};

export default useRejectQuotation;
