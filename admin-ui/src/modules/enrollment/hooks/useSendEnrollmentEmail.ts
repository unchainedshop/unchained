import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ISendEnrollmentEmailMutation,
  ISendEnrollmentEmailMutationVariables,
} from '../../../gql/types';

const SendEnrollmentEmailMutation = gql`
  mutation SendEnrollmentEmail($email: String!) {
    sendEnrollmentEmail(email: $email) {
      success
    }
  }
`;

const useSendEnrollmentEmail = () => {
  const [sendEnrollmentEmailMutation] = useMutation<
    ISendEnrollmentEmailMutation,
    ISendEnrollmentEmailMutationVariables
  >(SendEnrollmentEmailMutation);

  const sendEnrollmentEmail = async ({
    email,
  }: ISendEnrollmentEmailMutationVariables) => {
    return sendEnrollmentEmailMutation({
      variables: { email },
    });
  };

  return {
    sendEnrollmentEmail,
  };
};

export default useSendEnrollmentEmail;
