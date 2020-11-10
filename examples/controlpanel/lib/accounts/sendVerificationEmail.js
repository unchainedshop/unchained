import gql from 'graphql-tag';

export default async function sendVerificationEmail({ email }, apollo) {
  const result = await apollo.mutate({
    mutation: gql`
      mutation sendVerificationEmail($email: String) {
        sendVerificationEmail(email: $email) {
          success
        }
      }
    `,
    variables: {
      email,
    },
  });

  const { success } = result.data.sendVerificationEmail;
  return success;
}
