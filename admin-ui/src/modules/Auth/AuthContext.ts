import React from 'react';
import { IUser } from '../../gql/types';

type Auth = (currentUser?: IUser) => boolean;
const AuthContext = React.createContext<{
  isAdmin: Auth;
  hasRole:
    | ((actionName: (user) => boolean) => boolean)
    | ((actionName: string, componentName?: string) => boolean);
}>({
  isAdmin: () => false,
  hasRole: () => false,
});

export default AuthContext;
