import React from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import { Segment } from 'semantic-ui-react';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormNewAssortmentFilter = ({ filters, removeCountry, ...formProps }) => (
  <AutoForm {...formProps}>
    <Segment basic>
      <AutoField name={'assortmentId'} type="hidden" />
      <AutoField name={'filterId'} options={filters} />
      <ErrorsField />
      <SubmitField value="Add Filter" className="primary" />
    </Segment>
  </AutoForm>
);

export default compose(
  withRouter,
  graphql(gql`
    query assortmentFilters {
      filters(offset: 0, limit: 0) {
        _id
        key
        texts {
          _id
          title
        }
      }
    }
  `),
  graphql(
    gql`
      mutation addAssortmentFilter(
        $assortmentId: ID!
        $filterId: ID!
        $tags: [String!]
      ) {
        addAssortmentFilter(
          assortmentId: $assortmentId
          filterId: $filterId
          tags: $tags
        ) {
          _id
        }
      }
    `,
    {
      name: 'addAssortmentFilter',
      options: {
        refetchQueries: ['assortment', 'assortmentFilters'],
      },
    }
  ),
  withFormSchema({
    assortmentId: {
      type: String,
      label: null,
      optional: false,
    },
    filterId: {
      type: String,
      optional: false,
      label: 'Filter',
    },
    tags: {
      type: Array,
      optional: true,
      label: 'Tags',
    },
    'tags.$': String,
  }),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Filtered', { type: toast.TYPE.SUCCESS });
    },
    onSubmit: ({ addAssortmentFilter }) => ({ assortmentId, filterId, tags }) =>
      addAssortmentFilter({
        variables: {
          assortmentId,
          filterId,
          tags,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(
    ({
      assortmentId,
      addAssortmentFilter,
      data: { filters = [] },
      ...rest
    }) => ({
      filters: [{ label: 'Select', value: false }].concat(
        filters.map((filter) => ({
          label: filter.texts ? filter.texts.title : filter.key,
          value: filter._id,
        }))
      ),
      model: {
        assortmentId,
      },
      ...rest,
    })
  )
)(FormNewAssortmentFilter);
