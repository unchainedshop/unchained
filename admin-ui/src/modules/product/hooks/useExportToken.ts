import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IExportTokenMutation,
  IExportTokenMutationVariables,
} from '../../../gql/types';
import TokenFragment from '../fragments/TokenFragment';

const ExportTokenMutation = gql`
  mutation ExportToken(
    $tokenId: ID!
    $quantity: Int! = 1
    $recipientWalletAddress: String!
  ) {
    exportToken(
      tokenId: $tokenId
      quantity: $quantity
      recipientWalletAddress: $recipientWalletAddress
    ) {
      ...TokenFragment
    }
  }
  ${TokenFragment}
`;

const useExportToken = () => {
  const [exportTokenMutation] = useMutation<
    IExportTokenMutation,
    IExportTokenMutationVariables
  >(ExportTokenMutation);

  const exportToken = async ({
    quantity,
    recipientWalletAddress,
    tokenId,
  }: IExportTokenMutationVariables) => {
    return exportTokenMutation({
      variables: {
        quantity,
        recipientWalletAddress,
        tokenId,
      },
    });
  };

  return {
    exportToken,
  };
};

export default useExportToken;
