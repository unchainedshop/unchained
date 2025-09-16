import { gql } from '@apollo/client';

const WarehousingProviderFragment = gql`
  fragment WarehousingProviderFragment on WarehousingProvider {
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

export default WarehousingProviderFragment;
