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
import FormTagInput from '../FormTagInput';

const FormNewAssortmentLink = ({
  assortments,
  removeCountry,
  ...formProps
}) => (
    <AutoForm {...formProps}>
      <Segment basic>
        <AutoField name={'parentAssortmentId'} type="hidden" />
        <AutoField name={'childAssortmentId'} options={assortments} />
        <AutoField name="tags" component={FormTagInput} options={[]} />
        <ErrorsField />
        <SubmitField value="Add Link" className="primary" />
      </Segment>
    </AutoForm>
  );

export default compose(
  withRouter,
  graphql(gql`
    query assortments {
      assortments(offset: 0, limit: 0, includeLeaves: true) {
        _id
        texts {
          _id
          title
        }
      }
    }
  `),
  graphql(
    gql`
      mutation addAssortmentLink(
        $parentAssortmentId: ID!
        $childAssortmentId: ID!
        $tags: [String!]
      ) {
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
    }
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
    onSubmit: ({ addAssortmentLink }) => ({
      parentAssortmentId,
      childAssortmentId,
      tags,
    }) => {
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
  mapProps(
    ({
      parentAssortmentId,
      addAssortmentLink,
      data: { assortments = [] },
      ...rest
    }) => ({
      assortments: [{ label: 'Select', value: false }].concat(
        assortments
          .map((assortment) => ({
            label: assortment.texts.title,
            value: assortment._id,
          }))
          .filter(({ value }) => parentAssortmentId !== value)
      ),
      model: {
        parentAssortmentId,
      },
      ...rest,
    })
  )
)(FormNewAssortmentLink);
