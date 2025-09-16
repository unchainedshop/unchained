import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IVerifyQuotationMutation,
  IVerifyQuotationMutationVariables,
} from '../../../gql/types';
import QuotationDetailFragment from '../fragments/QuotationDetailFragment';

const VerifyQuotationMutation = gql`
  mutation VerifyQuotation($quotationId: ID!, $quotationContext: JSON) {
    verifyQuotation(
      quotationId: $quotationId
      quotationContext: $quotationContext
    ) {
      ...QuotationDetailFragment
    }
  }
  ${QuotationDetailFragment}
`;

const useVerifyQuotation = () => {
  const [verifyQuotationMutation] = useMutation<
    IVerifyQuotationMutation,
    IVerifyQuotationMutationVariables
  >(VerifyQuotationMutation);

  const VerifyQuotation = async ({
    quotationId = null,
    quotationContext = {},
  }: IVerifyQuotationMutationVariables) => {
    return verifyQuotationMutation({
      variables: { quotationId, quotationContext },
    });
  };

  return {
    VerifyQuotation,
  };
};

export default useVerifyQuotation;
