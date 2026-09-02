import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IBulkRemoveUsersMutation,
  IBulkRemoveUsersMutationVariables,
  IBulkSetUserRolesMutation,
  IBulkSetUserRolesMutationVariables,
  IBulkUpdateUserTagsMutation,
  IBulkUpdateUserTagsMutationVariables,
} from '../../../gql/types';

const BulkUpdateUserTagsMutation = gql`
  mutation BulkUpdateUserTags(
    $userIds: [ID!]!
    $add: [LowerCaseString!]
    $remove: [LowerCaseString!]
  ) {
    bulkUpdateUserTags(userIds: $userIds, add: $add, remove: $remove) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const BulkRemoveUsersMutation = gql`
  mutation BulkRemoveUsers($userIds: [ID!]!) {
    bulkRemoveUsers(userIds: $userIds) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const BulkSetUserRolesMutation = gql`
  mutation BulkSetUserRoles($userIds: [ID!]!, $roles: [String!]!) {
    bulkSetUserRoles(userIds: $userIds, roles: $roles) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const refetchQueries = ['Users', 'UsersCount'];
const setRolesRefetchQueries = [...refetchQueries, 'CurrentUser'];

const useBulkUserOperations = () => {
  const [bulkUpdateTagsMutation] = useMutation<
    IBulkUpdateUserTagsMutation,
    IBulkUpdateUserTagsMutationVariables
  >(BulkUpdateUserTagsMutation);
  const [bulkRemoveMutation] = useMutation<
    IBulkRemoveUsersMutation,
    IBulkRemoveUsersMutationVariables
  >(BulkRemoveUsersMutation);
  const [bulkSetRolesMutation] = useMutation<
    IBulkSetUserRolesMutation,
    IBulkSetUserRolesMutationVariables
  >(BulkSetUserRolesMutation);

  return {
    bulkUpdateUserTags: (
      userIds: string[],
      add?: string[],
      remove?: string[],
    ) =>
      bulkUpdateTagsMutation({
        variables: { userIds, add, remove },
        refetchQueries,
        awaitRefetchQueries: true,
      }),

    bulkRemoveUsers: (userIds: string[]) =>
      bulkRemoveMutation({
        variables: { userIds },
        refetchQueries,
        awaitRefetchQueries: true,
      }),

    bulkSetUserRoles: (userIds: string[], roles: string[]) =>
      bulkSetRolesMutation({
        variables: { userIds, roles },
        refetchQueries: setRolesRefetchQueries,
        awaitRefetchQueries: true,
      }),
  };
};

export default useBulkUserOperations;
