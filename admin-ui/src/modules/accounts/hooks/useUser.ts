import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IRoleAction,
  IUserPermissionsQuery,
  IUserPermissionsQueryVariables,
  IUserQuery,
  IUserQueryVariables,
} from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import MD5MetaDataFragment from '../fragment/MD5MetaDataFragment';

export const GetUserPermissionsQuery = gql`
  query UserPermissions($userId: ID!) {
    user(userId: $userId) {
      _id
      viewerAllowedActions
    }
  }
`;

const GetUserQuery = (inlineFragment = '') => gql`
  query User(
    $userId: ID!
    $includePrivateInfos: Boolean!
    $includeRoles: Boolean!
    $includeOrders: Boolean!
  ) {
    user(userId: $userId) {
      _id
      name
      avatar {
        _id
        name
        size
        type
        url
      }
      ... @include(if: $includePrivateInfos) {
        ${inlineFragment}
        lastBillingAddress {
          firstName
          lastName
          company
          addressLine
          addressLine2
          postalCode
          countryCode
          regionCode
          city
        }
        lastContact {
          emailAddress
          telNumber
        }
        lastLogin {
          countryCode
          locale
          remoteAddress
          remotePort
          timestamp
          userAgent
        }
        paymentCredentials {
          _id
          isValid
          isPreferred
          paymentProvider {
            _id
            type
            interface {
              _id
              label
              version
            }
          }
        }
        emails {
          verified
          address
        }
        web3Addresses {
          address
          nonce
          verified
        }
        webAuthnCredentials {
          _id
          created
          aaguid
          counter
          mdsMetadata {
            ...MD5MetaDataFragment
          }
        }
        profile {
          displayName
          phoneMobile
          gender
          address {
            firstName
            lastName
            company
            addressLine
            addressLine2
            postalCode
            countryCode
            regionCode
            city
          }
          birthday
        }
        username
        primaryEmail {
          verified
          address
        }
        isGuest
        isInitialPassword
        tags
        deleted
      }
      ... @include(if: $includeRoles) {
        roles
      }
      ... @include(if: $includeOrders) {
        cart {
          _id
          items {
            _id
          }
        }
        orders {
          _id
          items {
            _id
          }
        }
      }
    }
  }
  ${MD5MetaDataFragment}
`;

const useUser = ({ userId = null }: { userId?: string | null } = {}) => {
  const { customProperties, hydrateFragment } = useUnchainedContext();
  const skip = !userId;

  const {
    data: permissionsData,
    loading: permissionsLoading,
    error: permissionsError,
  } = useQuery<IUserPermissionsQuery, IUserPermissionsQueryVariables>(
    GetUserPermissionsQuery,
    {
      skip,
      variables: { userId: userId! },
      fetchPolicy: 'network-only',
    },
  );

  const permissionTarget =
    permissionsData?.user?._id === userId ? permissionsData.user : null;
  const viewerAllowedActions = permissionTarget?.viewerAllowedActions;
  const hasPermission = (action: IRoleAction) =>
    viewerAllowedActions?.includes(action) ?? false;

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery<IUserQuery, IUserQueryVariables>(
    GetUserQuery(customProperties?.User),
    {
      skip: skip || !permissionTarget,
      variables: {
        userId: userId!,
        includePrivateInfos: hasPermission(IRoleAction.ViewUserPrivateInfos),
        includeRoles: hasPermission(IRoleAction.ViewUserRoles),
        includeOrders: hasPermission(IRoleAction.ViewUserOrders),
      },
    },
  );

  const user =
    permissionTarget && userData?.user?._id === userId
      ? { ...permissionTarget, ...userData.user }
      : null;
  const extendedData = hasPermission(IRoleAction.ViewUserPrivateInfos)
    ? hydrateFragment(customProperties?.User, user)
    : null;

  return {
    user,
    loading: permissionsLoading || userLoading,
    error: permissionsError || userError,
    extendedData,
  };
};

export default useUser;
