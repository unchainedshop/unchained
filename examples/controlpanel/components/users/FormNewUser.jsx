import React from 'react';
import { withRouter } from 'next/router';
import BaseField from 'uniforms/BaseField';
import nothing from 'uniforms/nothing';
import { graphql } from '@apollo/client/react/hoc';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { Grid, Segment } from 'semantic-ui-react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import withFormSchema from '../../lib/withFormSchema';

const DisplayIf = ({ children, condition }, { uniforms }) =>
  condition(uniforms) ? React.Children.only(children) : nothing;
DisplayIf.contextTypes = BaseField.contextTypes;

const FormNewUser = (formProps) => (
  <Segment>
    <AutoForm showInlineError {...formProps}>
      <Grid stackable columns={3}>
        <Grid.Row columns={1}>
          <Grid.Column width={16}>
            <AutoField name="displayName" />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={1}>
          <Grid.Column width={16}>
            <AutoField name="email" />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={2}>
          <Grid.Column width={6}>
            <AutoField name="enroll" />
            <p>
              If you activate enrollment, I will not set a password and the user
              gets a special email instead, where he/she can set his initial
              password.
            </p>
          </Grid.Column>
          <Grid.Column width={6}>
            <DisplayIf condition={(context) => !context.model.enroll}>
              <AutoField name="password" type="password" required />
            </DisplayIf>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={1}>
          <Grid.Column>
            <ErrorsField />
            <SubmitField value="Add user" className="primary" />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </AutoForm>
  </Segment>
);

export default compose(
  withRouter,
  graphql(
    gql`
      mutation enrollUser(
        $profile: UserProfileInput!
        $email: String!
        $password: String
      ) {
        enrollUser(profile: $profile, email: $email, plainPassword: $password) {
          _id
          name
          primaryEmail {
            address
          }
        }
      }
    `,
    { name: 'enrollUser' }
  ),
  graphql(
    gql`
      mutation sendEnrollmentEmail($email: String!) {
        sendEnrollmentEmail(email: $email) {
          success
        }
      }
    `,
    { name: 'sendEnrollmentEmail' }
  ),
  withFormSchema({
    displayName: {
      type: String,
      optional: false,
      label: 'Display Name',
    },
    email: {
      type: String,
      optional: false,
      label: 'E-Mail address',
    },
    password: {
      type: String,
      optional: true,
      label: 'Password',
      custom() {
        if (!this.obj.enroll && (!this.value || this.value === '')) {
          return 'required';
        }
        return null;
      },
    },
    enroll: {
      type: Boolean,
      optional: false,
      defaultValue: true,
      label: 'Enrollment?',
    },
  }),
  withHandlers({
    onSubmitSuccess: ({ router }) => ({ data: { enrollUser } }) => {
      router.replace({
        pathname: '/users/edit',
        query: { _id: enrollUser._id },
      });
    },
    onSubmit: ({ enrollUser, sendEnrollmentEmail, schema }) => async ({
      ...dirtyInput
    }) => {
      const { displayName, email, password, enroll } = schema.clean(dirtyInput);
      const enrollmentResult = await enrollUser({
        variables: {
          profile: { displayName },
          email,
          password: !enroll && password ? password : null,
        },
      });
      if (enroll) {
        await sendEnrollmentEmail({ variables: { email } });
      }
      return enrollmentResult;
    },
  }),
  withFormErrorHandlers,
  mapProps(
    ({
      enrollUser,
      enrollUserResult,
      sendEnrollmentEmail,
      sendEnrollmentEmailResult,
      data,
      userId,
      ...rest
    }) => {
      return {
        ...rest,
      };
    }
  ),
  pure
)(FormNewUser);
