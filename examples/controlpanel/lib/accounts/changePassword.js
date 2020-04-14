import gql from 'graphql-tag';

export default async function ({ oldPassword, newPassword }, apollo) {
  if (!oldPassword || !newPassword)
    throw new Error('Old and new password are required');

  const result = await apollo.mutate({
    mutation: gql`
      mutation changePassword($oldPassword: String!, $newPassword: String!) {
        changePassword(
          oldPlainPassword: $oldPassword
          newPlainPassword: $newPassword
        ) {
          success
        }
      }
    `,
    variables: {
      oldPassword,
      newPassword,
    },
  });

  const { success } = result.data.changePassword;
  return success;
}
