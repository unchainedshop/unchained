import React from 'react';
import sharedContext from '../common/utils/sharedContext';
import { IRoleAction, IUser } from '../../gql/types';

type Auth = (currentUser?: IUser) => boolean;
const AuthContext = sharedContext(
  'AuthContext',
  React.createContext<{
    isAdmin: Auth;
    // Plugin actions (rolesOptions.additionalActions) are strings the generated enum does not list;
    // User.allowedActions contains them as well.
    hasRole: (
      actionName: IRoleAction | (string & {}) | ((user) => boolean),
      componentName?: string,
    ) => boolean;
  }>({
    isAdmin: () => false,
    hasRole: () => false,
  }),
);

export default AuthContext;
