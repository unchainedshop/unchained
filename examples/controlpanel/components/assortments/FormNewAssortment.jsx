import React from 'react';
import { compose, mapProps, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { withRouter } from 'next/router';
import { graphql } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormNewAssortment = (formProps) => (
  <AutoForm {...formProps}>
    <ErrorsField />
    <AutoField name={'title'} />
    <AutoField name={'isRoot'} />
    <SubmitField value="Add assortment" className="primary" />
  </AutoForm>
);

export default compose(
  withRouter,
  graphql(
    gql`
      mutation create($assortment: CreateAssortmentInput!) {
        createAssortment(assortment: $assortment) {
          _id
        }
      }
    `,
    {
      name: 'createAssortment',
      options: {
        refetchQueries: ['assortments'],
      },
    }
  ),
  withFormSchema({
    title: {
      type: String,
      optional: false,
      label: 'Title',
    },
    isRoot: {
      type: Boolean,
      optional: false,
      defaultValue: true,
      label: 'Root node',
    },
  }),
  withHandlers({
    onSubmitSuccess: ({ router }) => ({ data: { createAssortment } }) => {
      router.replace({
        pathname: '/assortments/edit',
        query: { _id: createAssortment._id },
      });
    },
    onSubmit: ({ createAssortment, schema }) => ({ ...dirtyInput }) =>
      createAssortment({
        variables: {
          assortment: schema.clean(dirtyInput),
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ createAssortment, ...rest }) => ({
    ...rest,
  }))
)(FormNewAssortment);
