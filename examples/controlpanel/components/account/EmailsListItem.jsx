import React from 'react';
import { compose, pure, withHandlers } from 'recompose';
import { graphql, withApollo } from '@apollo/client/react/hoc';
import gql from 'graphql-tag';
import { Message, Button } from 'semantic-ui-react';
import { sendVerificationEmail } from '../../lib/accounts';

const EmailsListItem = ({
  removeEmail,
  address,
  verified,
  sendVerification,
  disableSendVerificationEmail,
}) => (
  <div>
    {address}
    <Button type="button" floated="right" basic secondary onClick={removeEmail}>
      Remove
    </Button>
    {verified ? (
      <Message positive>
        <Message.Header>E-Mail address verified</Message.Header>
        <p>This E-Mail address has been successfully verified.</p>
      </Message>
    ) : (
      <Message warning visible>
        <Message.Header>
          E-Mail address unverified
          {!disableSendVerificationEmail && (
            <Button type="button" floated="right" basic secondary onClick={sendVerification}>
              Send verification mail
            </Button>
          )}
        </Message.Header>
        <p>Send and then check your inbox</p>
      </Message>
    )}
  </div>
);

export default compose(
  withApollo,
  graphql(gql`
    mutation removeEmail($email: String!, $userId: ID) {
      removeEmail(email: $email, userId: $userId) {
        _id
        emails {
          verified
          address
        }
      }
    }
  `),
  withHandlers({
    removeEmail:
      ({ mutate, userId, address }) =>
      () =>
        mutate({
          variables: {
            email: address,
            userId,
          },
        }),
    sendVerification:
      ({ client, address }) =>
      () =>
        sendVerificationEmail(
          {
            email: address,
          },
          client,
        ),
  }),
  pure,
)(EmailsListItem);
