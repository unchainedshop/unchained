import { gql } from '@apollo/client';

const logOut = async (apollo, router = null) => {
  await apollo.mutate({
    mutation: gql`
      mutation Logout {
        logout {
          success
        }
      }
    `,
  });
  await apollo.resetStore();

  // Redirect to login page if router is provided
  if (router) {
    router.push('/log-in');
  } else if (typeof window !== 'undefined') {
    // Fallback to window.location if no router provided
    window.location.href = '/log-in';
  }
};

export default logOut;
