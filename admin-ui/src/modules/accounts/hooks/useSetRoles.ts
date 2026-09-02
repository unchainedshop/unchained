import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ISetRolesMutation,
  ISetRolesMutationVariables,
} from '../../../gql/types';

const SetRoleMutation = gql`
  mutation SetRoles($roles: [String!]!, $userId: ID!) {
    setRoles(roles: $roles, userId: $userId) {
      _id
    }
  }
`;

const useSetRoles = () => {
  const [setRoleMutation] = useMutation<
    ISetRolesMutation,
    ISetRolesMutationVariables
  >(SetRoleMutation);

  const setRoles = async ({
    roles = [],
    userId = null,
  }: ISetRolesMutationVariables) => {
    return setRoleMutation({
      variables: {
        roles,
        userId,
      },
      refetchQueries: ['UserPermissions', 'User', 'CurrentUser'],
    });
  };

  return {
    setRoles,
  };
};

export default useSetRoles;
