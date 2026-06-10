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
  try {
    await apollo.resetStore();
  } catch (e) {
    if (e?.name !== 'AbortError') throw e;
  }

  if (router) {
    router.push('/log-in');
  } else if (typeof window !== 'undefined') {
    window.location.href = '/log-in';
  }
};

export default logOut;
