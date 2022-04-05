import React from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import { Segment } from 'semantic-ui-react';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';
import { connectField } from 'uniforms';
import { graphql } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import SearchDropdown from '../SearchDropdown';
import { SEARCH_ASSORTMENTS } from '../searchQueries';
import FormTagInput from '../FormTagInput';

const AssortmentSearchDropdownField = connectField(SearchDropdown);

const FormNewAssortmentLink = ({ assortments, removeCountry, ...formProps }) => {
  return (
    <AutoForm {...formProps}>
      <Segment basic>
        <AutoField name={'parentAssortmentId'} type="hidden" />
        <AutoField
          name={'childAssortmentId'}
          queryType={'assortments'}
          filterIds={[formProps.model.parentAssortmentId]}
          searchQuery={SEARCH_ASSORTMENTS}
          uniforms
        />
        <AutoField name="tags" component={FormTagInput} options={[]} />
        <ErrorsField />
        <SubmitField value="Add Link" className="primary" />
      </Segment>
    </AutoForm>
  );
};

export default compose(
  withRouter,
  graphql(
    gql`
      mutation addAssortmentLink($parentAssortmentId: ID!, $childAssortmentId: ID!, $tags: [String!]) {
        addAssortmentLink(
          parentAssortmentId: $parentAssortmentId
          childAssortmentId: $childAssortmentId
          tags: $tags
        ) {
          _id
        }
      }
    `,
    {
      name: 'addAssortmentLink',
      options: {
        refetchQueries: ['assortment', 'assortmentLinks'],
      },
    },
  ),
  withFormSchema({
    parentAssortmentId: {
      type: String,
      label: null,
      optional: false,
    },
    childAssortmentId: {
      type: String,
      optional: false,
      label: 'Subassortment',
      uniforms: {
        component: AssortmentSearchDropdownField,
      },
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
      toast('Linked', { type: toast.TYPE.SUCCESS });
    },
    onSubmit:
      ({ addAssortmentLink }) =>
      ({ parentAssortmentId, childAssortmentId, tags }) => {
        return addAssortmentLink({
          variables: {
            parentAssortmentId,
            childAssortmentId,
            tags,
          },
        });
      },
  }),
  withFormErrorHandlers,
  mapProps(({ parentAssortmentId, addAssortmentLink, ...rest }) => ({
    model: {
      parentAssortmentId,
    },
    ...rest,
  })),
)(FormNewAssortmentLink);
