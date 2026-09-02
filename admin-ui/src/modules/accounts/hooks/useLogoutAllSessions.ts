import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const LogoutAllSessionsMutation = gql`
  mutation LogoutAllSessions($userId: ID) {
    logoutAllSessions(userId: $userId) {
      success
    }
  }
`;

const useLogoutAllSessions = () => {
  const [logoutAllSessionsMutation] = useMutation<
    { logoutAllSessions: { success: boolean } },
    { userId?: string }
  >(LogoutAllSessionsMutation);

  const logoutAllSessions = async ({ userId }: { userId?: string } = {}) => {
    return logoutAllSessionsMutation({ variables: { userId } });
  };

  return {
    logoutAllSessions,
  };
};

export default useLogoutAllSessions;
