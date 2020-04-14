import React from 'react';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { graphql, withApollo } from 'react-apollo';
import SelectField from 'uniforms-semantic/SelectField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import gql from 'graphql-tag';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormSetRoles = ({ ...formProps }) => (
  <AutoForm {...formProps}>
    <SelectField name="roles" checkboxes />
    <ErrorsField />
    <SubmitField value="Update permissions" className="primary" />
  </AutoForm>
);

export default compose(
  withApollo,
  graphql(gql`
    query userRoles($userId: ID) {
      user(userId: $userId) {
        _id
        roles
      }
      shopInfo {
        _id
        userRoles
      }
    }
  `),
  graphql(gql`
    mutation setRoles($roles: [String!]!, $userId: ID!) {
      setRoles(roles: $roles, userId: $userId) {
        _id
      }
    }
  `),
  withFormSchema(({ data: { shopInfo } }) => {
    return {
      roles: {
        type: Array,
        label: 'Roles',
      },
      'roles.$': {
        type: String,
        allowedValues: shopInfo ? shopInfo.userRoles : [],
      },
    };
  }),
  withFormModel(({ data: { user } }) => ({
    roles: (user && user.roles) || [],
  })),
  withHandlers({
    onSubmit: ({ mutate, schema, userId }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          ...schema.clean(dirtyInput),
          userId,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ userId, mutate, client, ...rest }) => ({ ...rest })),
  pure
)(FormSetRoles);
