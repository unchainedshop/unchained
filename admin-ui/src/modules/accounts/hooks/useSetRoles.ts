import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ISetRolesMutation,
  ISetRolesMutationVariables,
} from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const SetRoleMutation = gql`
  mutation SetRoles($roles: [String!]!, $userId: ID!) {
    setRoles(roles: $roles, userId: $userId) {
      ...UserFragment
    }
  }
  ${UserFragment}
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
      refetchQueries: ['User'],
    });
  };

  return {
    setRoles,
  };
};

export default useSetRoles;
