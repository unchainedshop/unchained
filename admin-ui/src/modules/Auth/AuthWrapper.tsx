import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import useCurrentUser from '../accounts/hooks/useCurrentUser';
import AuthContext from './AuthContext';
import {
  checkAccess,
  checkRole,
  isPublicOnlyPage,
  isUserAdmin,
  isUserAuthenticated,
} from './permissionConfig';
import Loading from '@/components/ui/Loading';
import useUsersCount from '../accounts/hooks/useUsersCount';

const AuthWrapper = ({ children }) => {
  const router = useRouter();
  const { currentUser, loading } = useCurrentUser();
  const {
    loading: usersCountLoading,
    usersCount,
    error: userCountError,
  } = useUsersCount();

  const ctx = useMemo(() => {
    return {
      isAdmin: () => {
        return isUserAdmin(currentUser);
      },
      hasRole: (action: string | ((user) => boolean)) => {
        if (typeof action === 'function') {
          return action(currentUser);
        }
        return checkRole(currentUser, action);
      },
    };
  }, [currentUser]);

  useEffect(() => {
    if (loading || usersCountLoading) return;
    let nextPathname = undefined;
    if (isUserAuthenticated(currentUser)) {
      if (!checkAccess(currentUser, router.pathname)) {
        nextPathname = '/403';
      } else if (isPublicOnlyPage(router.pathname)) {
        nextPathname = '/';
      } else if (
        !isUserAdmin(currentUser) &&
        !!process.env.NEXT_PUBLIC_ONLY_ADMIN &&
        router.pathname !== '/423'
      ) {
        nextPathname = '/423';
      }
    } else if (!usersCountLoading && !userCountError && usersCount === 0) {
      nextPathname = '/install';
    } else if (!checkAccess(currentUser, router.pathname)) {
      nextPathname = '/log-in';
    }
    if (nextPathname && router.pathname !== nextPathname) {
      router.replace(nextPathname);
    }
  }, [currentUser, loading, router, usersCountLoading]);

  return (
    <AuthContext.Provider value={ctx}>
      {loading && !currentUser ? <Loading /> : children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;
