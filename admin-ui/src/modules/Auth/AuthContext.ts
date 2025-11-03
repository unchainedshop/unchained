import React from 'react';
import { IUser } from '../../gql/types';

type Auth = (currentUser?: IUser) => boolean;
const AuthContext = React.createContext<{
  isAdmin: Auth;
  hasRole: (
    actionName: string | ((user) => boolean),
    componentName?: string,
  ) => boolean;
}>({
  isAdmin: () => false,
  hasRole: () => false,
});

export default AuthContext;
