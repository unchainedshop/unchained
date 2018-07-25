import {
  compose, pure, mapProps, withHandlers,
} from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Grid, Segment, Divider } from 'semantic-ui-react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import FormTagInput from '../../lib/FormTagInput';

const FormTags = ({ userId, ...formProps }) => (
  <Segment>
    <AutoForm showInlineError {...formProps}>
      <Grid stackable columns={3}>
        <Grid.Row columns={1}>
          <Grid.Column textAlign="center">
            <AutoField
              name="tags"
              component={FormTagInput}
              options={[]}
            />
            <Divider />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row columns={2}>
          <Grid.Column width={8}>
            <ErrorsField />
            <SubmitField value="Save" className="primary" />
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </AutoForm>
  </Segment>
);

export const TAGS = 'TAGS';

export default compose(
  graphql(gql`
    query getUserTags($userId: ID) {
      user(userId: $userId) {
        _id
        tags
      }
    }
  `),
  graphql(gql`
    mutation updateUserUserTags($tags: [String]!, $userId: ID!) {
      updateUserUserTags(tags: $tags, userId: $userId) {
        _id
        tags
      }
    }
  `),
  withFormSchema({
    tags: {
      type: Array,
      optional: true,
      label: 'Tags (Kundensegmentierung)',
    },
    'tags.$': String,
  }),
  withFormModel(({ data: { user } }) => (user && user.tags) || {}),
  withHandlers({
    onSubmit: ({ userId, mutate, schema }) => ({ ...dirtyInput }) => mutate({
      variables: {
        userId,
        ...schema.clean(dirtyInput),
      },
    }),
  }),
  withFormErrorHandlers,
  mapProps(({
    userId,
    error,
    schema,
    model,
    onSubmit,
    onChange,
    onSubmitSuccess,
    onSubmitFailure,
  }) => ({
    userId,
    error,
    schema,
    model,
    onSubmit,
    onChange,
    onSubmitSuccess,
    onSubmitFailure,
  })),
  pure,
)(FormTags);
