import React from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import { Grid } from 'semantic-ui-react';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import FormTagInput from '../../lib/FormTagInput';

const FormEditAssortment = ({ removeAssortment, ...formProps }) => (
  <AutoForm {...formProps}>
    <Grid>
      <Grid.Row columns={1}>
        <Grid.Column width={12}>
          <AutoField name={'isActive'} />
          <AutoField name={'isRoot'} />
          <AutoField
            name="tags"
            component={FormTagInput}
            options={[]}
          />
        </Grid.Column>
      </Grid.Row>
    </Grid>
    <ErrorsField />
    <br />
    <SubmitField value="Save" className="primary" />
  </AutoForm>
);

export default compose(
  withRouter,
  graphql(gql`
    query assortment($assortmentId: ID!) {
      assortment(assortmentId: $assortmentId) {
        _id
        sequence
        created
        updated
        isActive
        isRoot
        tags
        texts {
          _id
          title
          slug
        }
      }
    }
  `),
  graphql(gql`
    mutation updateAssortment($assortment: UpdateAssortmentInput!, $assortmentId: ID!) {
      updateAssortment(assortment: $assortment, assortmentId: $assortmentId) {
        _id
        isActive
        isRoot
        tags
      }
    }
  `, {
    name: 'updateAssortment',
    options: {
      refetchQueries: [
        'assortment',
        'assortments',
      ],
    },
  }),
  withFormSchema({
    isActive: {
      type: Boolean,
      optional: false,
      label: 'Active',
    },
    isRoot: {
      type: Boolean,
      optional: false,
      label: 'Root',
    },
    tags: {
      type: Array,
      optional: true,
      label: 'Tags',
    },
    'tags.$': String,
  }),
  withFormModel(({ data: { assortment = {} } }) => (assortment)),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Assortment saved', { type: toast.TYPE.SUCCESS }); // eslint-disable-line
    },
    onSubmit: ({ assortmentId, schema, updateAssortment }) => formData => updateAssortment({
      variables: {
        assortment: schema.clean(formData),
        assortmentId,
      },
    }),
  }),
  withFormErrorHandlers,
  mapProps(({
    assortmentId, updateAssortment, ...rest
  }) => ({
    ...rest,
  })),
)(FormEditAssortment);
