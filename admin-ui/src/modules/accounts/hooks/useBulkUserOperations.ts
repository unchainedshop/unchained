import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

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

const useBulkUserOperations = () => {
  const [bulkUpdateTagsMutation] = useMutation(BulkUpdateUserTagsMutation);
  const [bulkRemoveMutation] = useMutation(BulkRemoveUsersMutation);
  const [bulkSetRolesMutation] = useMutation(BulkSetUserRolesMutation);

  return {
    bulkUpdateUserTags: (
      userIds: string[],
      add?: string[],
      remove?: string[],
    ) =>
      bulkUpdateTagsMutation({
        variables: { userIds, add, remove },
        refetchQueries,
      }),

    bulkRemoveUsers: (userIds: string[]) =>
      bulkRemoveMutation({
        variables: { userIds },
        refetchQueries,
      }),

    bulkSetUserRoles: (userIds: string[], roles: string[]) =>
      bulkSetRolesMutation({
        variables: { userIds, roles },
        refetchQueries,
      }),
  };
};

export default useBulkUserOperations;
