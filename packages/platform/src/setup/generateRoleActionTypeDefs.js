import { roles } from 'meteor/unchained:api';

export const generateRoleActionTypeDefs = () => [
  /* GraphQL */ `
      extend enum RoleAction {
        ${Object.keys(roles.actions).join(',')}
      }
    `,
];
