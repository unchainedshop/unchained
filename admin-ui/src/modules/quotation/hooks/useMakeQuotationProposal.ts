import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IMakeQuotationProposalMutation,
  IMakeQuotationProposalMutationVariables,
} from '../../../gql/types';
import QuotationDetailFragment from '../fragments/QuotationDetailFragment';

const MakeQuotationProposalMutation = gql`
  mutation MakeQuotationProposal($quotationId: ID!, $quotationContext: JSON) {
    makeQuotationProposal(
      quotationId: $quotationId
      quotationContext: $quotationContext
    ) {
      ...QuotationDetailFragment
    }
  }
  ${QuotationDetailFragment}
`;

const useMakeQuotationProposal = () => {
  const [makeQuotationProposalMutation] = useMutation<
    IMakeQuotationProposalMutation,
    IMakeQuotationProposalMutationVariables
  >(MakeQuotationProposalMutation);

  const makeQuotationProposal = async ({
    quotationId = null,
    quotationContext = {},
  }: IMakeQuotationProposalMutationVariables) => {
    return makeQuotationProposalMutation({
      variables: { quotationId, quotationContext },
    });
  };

  return {
    makeQuotationProposal,
  };
};

export default useMakeQuotationProposal;
