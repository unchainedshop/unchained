import React from 'react';
import sharedContext from '../common/utils/sharedContext';
import { IRoleAction, IUser } from '../../gql/types';

type Auth = (currentUser?: IUser) => boolean;
const AuthContext = sharedContext(
  'AuthContext',
  React.createContext<{
    isAdmin: Auth;
    hasRole: (actionName: IRoleAction | ((user) => boolean), componentName?: string) => boolean;
  }>({
    isAdmin: () => false,
    hasRole: () => false,
  }),
);

export default AuthContext;
