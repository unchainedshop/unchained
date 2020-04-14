import React from 'react';
import { toast } from 'react-toastify';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { Grid } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormEditFilter = ({ ...formProps }) => (
  <AutoForm {...formProps}>
    <Grid>
      <Grid.Row columns={1}>
        <Grid.Column width={12}>
          <AutoField name="isActive" />
        </Grid.Column>
      </Grid.Row>
    </Grid>
    <ErrorsField />
    <br />
    <SubmitField value="Save" className="primary" />
  </AutoForm>
);

export default compose(
  graphql(gql`
    query filterMain($filterId: ID) {
      filter(filterId: $filterId) {
        _id
        isActive
      }
    }
  `),
  graphql(
    gql`
      mutation updateFilter($filter: UpdateFilterInput!, $filterId: ID!) {
        updateFilter(filter: $filter, filterId: $filterId) {
          _id
          isActive
        }
      }
    `,
    {
      options: {
        refetchQueries: ['filterInfos', 'filters'],
      },
    }
  ),
  withFormSchema(() => ({
    isActive: {
      type: Boolean,
      label: 'Active',
    },
  })),
  withFormModel(({ data: { filter = {} } }) => ({ ...filter })),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Filter saved', { type: toast.TYPE.SUCCESS });
    },
    onSubmit: ({ filterId, mutate, schema }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          filter: schema.clean(dirtyInput),
          filterId,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ filterId, mutate, data, ...rest }) => ({
    ...rest,
  })),
  pure
)(FormEditFilter);
