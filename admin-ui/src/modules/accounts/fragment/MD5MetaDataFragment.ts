import { gql } from '@apollo/client';

const MD5MetaDataFragment = gql`
  fragment MD5MetaDataFragment on WebAuthnMDSv3Metadata {
    legalHeader
    description
    authenticatorVersion
    protocolFamily
    schema
    authenticationAlgorithms
    publicKeyAlgAndEncodings
    attestationTypes
    keyProtection
    upv
    tcDisplay
    authenticationAlgorithms
    publicKeyAlgAndEncodings
    icon
    authenticatorGetInfo
  }
`;

export default MD5MetaDataFragment;
