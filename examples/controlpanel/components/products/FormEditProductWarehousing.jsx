import React from 'react';
import { toast } from 'react-toastify';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { Segment, Grid } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormEditProductWarehousing = ({ isEditingDisabled, ...formProps }) => (
  <Segment>
    <AutoForm {...formProps}>
      <Grid>
        <Grid.Row columns={1}>
          <Grid.Column width={16}>
            <AutoField name="sku" disabled={isEditingDisabled} />
            <AutoField name="baseUnit" disabled={isEditingDisabled} />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <ErrorsField />
      <br />
      <SubmitField
        value="Save"
        className="primary"
        disabled={isEditingDisabled}
      />
    </AutoForm>
  </Segment>
);

export default compose(
  graphql(gql`
    query productWarehousingInfo($productId: ID) {
      product(productId: $productId) {
        _id
        status
        ... on SimpleProduct {
          sku
          baseUnit
        }
      }
    }
  `),
  graphql(
    gql`
      mutation updateProductWarehousing(
        $warehousing: UpdateProductWarehousingInput!
        $productId: ID!
      ) {
        updateProductWarehousing(
          warehousing: $warehousing
          productId: $productId
        ) {
          _id
          ... on SimpleProduct {
            sku
            baseUnit
          }
        }
      }
    `,
    {
      options: {
        refetchQueries: ['productWarehousingInfo'],
      },
    }
  ),
  withFormSchema({
    sku: {
      type: String,
      optional: true,
      label: 'SKU',
    },
    baseUnit: {
      type: String,
      optional: true,
      label: 'Base unit',
    },
  }),
  withFormModel(({ data: { product = {} } }) => ({ ...product })),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Warehousing settings saved', { type: toast.TYPE.SUCCESS });
    },
    onSubmit: ({ productId, mutate, schema }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          warehousing: schema.clean(dirtyInput),
          productId,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ productId, mutate, data, ...rest }) => ({
    isEditingDisabled: !data.product || data.product.status === 'DELETED',
    ...rest,
  })),
  pure
)(FormEditProductWarehousing);
