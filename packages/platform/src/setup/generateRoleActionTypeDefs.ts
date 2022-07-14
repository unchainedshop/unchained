import { roles } from '@unchainedshop/api';

export const generateRoleActionTypeDefs = () => [
  /* GraphQL */ `
      extend enum RoleAction {
        ${Object.keys(roles.actions).join(',')}
      }
    `,
];
