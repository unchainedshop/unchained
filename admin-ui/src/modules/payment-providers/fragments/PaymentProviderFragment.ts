import { gql } from '@apollo/client';

const PaymentProviderFragment = gql`
  fragment PaymentProviderFragment on PaymentProvider {
    _id
    created
    updated
    deleted
    isActive
    type
    interface {
      _id
      label
      version
    }
    configuration
    configurationError
  }
`;

export default PaymentProviderFragment;
