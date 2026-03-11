import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ISetEventScannerPassCodeMutation,
  ISetEventScannerPassCodeMutationVariables,
} from '../../../gql/types';

const SetEventScannerPassCodeMutation = gql`
  mutation SetEventScannerPassCode($productId: ID!, $passCode: String) {
    setEventScannerPassCode(productId: $productId, passCode: $passCode) {
      _id
      ... on TokenizedProduct {
        scannerPassCode
      }
    }
  }
`;

const useSetScannerPassCode = () => {
  const [setPassCodeMutation] = useMutation<
    ISetEventScannerPassCodeMutation,
    ISetEventScannerPassCodeMutationVariables
  >(SetEventScannerPassCodeMutation);

  const setScannerPassCode = async ({
    productId,
    passCode,
  }: {
    productId: string;
    passCode: string | null;
  }) => {
    return setPassCodeMutation({
      variables: { productId, passCode },
      refetchQueries: ['Product'],
    });
  };

  return { setScannerPassCode };
};

export default useSetScannerPassCode;
