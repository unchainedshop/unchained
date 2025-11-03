import { useRouter } from 'next/router';
import React, { useEffect, useMemo } from 'react';
import useCurrentUser from '../accounts/hooks/useCurrentUser';
import AuthContext from './AuthContext';
import loadRoleConfig from '../common/utils/loadRoleConfig';
import Loading from '../common/components/Loading';
import useUsersCount from '../accounts/hooks/useUsersCount';

const AuthWrapper = ({ children }) => {
  const router = useRouter();
  const { currentUser, loading } = useCurrentUser();
  const {
    loading: usersCountLoading,
    usersCount,
    error: userCountError,
  } = useUsersCount();
  const {
    checkAccess,
    isUserAuthenticated,
    isUserAdmin,
    checkRole,
    isPublicOnlyPage,
  } = useMemo(() => loadRoleConfig(), []);

  const ctx = useMemo(() => {
    return {
      isAdmin: () => {
        if (!isUserAdmin) return false;
        return isUserAdmin(currentUser);
      },
      hasRole: (action) => {
        if (!checkRole) return false;
        return checkRole(currentUser, action);
      },
    };
  }, [currentUser, checkRole, isUserAdmin]);

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
  }, [
    currentUser,
    loading,
    isUserAdmin,
    isUserAuthenticated,
    isPublicOnlyPage,
    router,
    checkAccess,
    usersCountLoading,
  ]);

  return (
    <AuthContext.Provider value={ctx}>
      {loading && !currentUser ? <Loading /> : children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;
