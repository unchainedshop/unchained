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

const FormEditAssortment = ({ removeAssortment, ...formProps }) => (
  <AutoForm {...formProps} >
    <Grid>
      <Grid.Row columns={1}>
        <Grid.Column width={12}>
          <AutoField name={'isActive'} />
          <AutoField name={'isRoot'} />
        </Grid.Column>
      </Grid.Row>
    </Grid>
    <ErrorsField />
    <br />
    <SubmitField value="Speichern" className="primary" />
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
        texts {
          title
          slug
        }
        productAssignments {
          _id
          sortKey
          product {
            _id
          }
        }
        linkedAssortments {
          _id
          sortKey
          parent {
            _id
            texts {
              title
            }
          }
          child {
            _id
            texts {
              title
            }
          }
        }
      }
    }
  `),
  graphql(gql`
    mutation updateAssortment($assortment: UpdateAssortmentInput!, $assortmentId: ID!) {
      updateAssortment(assortment: $assortment, assortmentId: $assortmentId) {
        _id
        isActive
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
  }),
  withFormModel(({ data: { assortment = {} } }) => (assortment)),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Assortment saved', { type: toast.TYPE.SUCCESS }); // eslint-disable-line
    },
    onSubmit: ({ assortmentId, updateAssortment }) =>
      ({ isActive }) => updateAssortment({
        variables: {
          assortment: { isActive },
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
