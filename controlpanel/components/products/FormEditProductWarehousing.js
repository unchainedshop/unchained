import React from 'react';
import { toast } from 'react-toastify';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { Segment, Grid } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
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
            <AutoField
              name="sku"
              disabled={isEditingDisabled}
            />
            <AutoField
              name="maxAllowedQuantityPerOrder"
              disabled={isEditingDisabled}
            />
            <AutoField
              name="allowOrderingIfNoStock"
              disabled={isEditingDisabled}
            />
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <ErrorsField />
      <br />
      <SubmitField
        value="Speichern"
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
        ... on ProductWarehousing {
          sku
          maxAllowedQuantityPerOrder
          allowOrderingIfNoStock
        }
      }
    }
  `),
  graphql(gql`
    mutation updateProductWarehousing($warehousing: UpdateProductWarehousingInput!, $productId: ID!) {
      updateProductWarehousing(warehousing: $warehousing, productId: $productId) {
        _id
        ... on ProductWarehousing {
          sku
          maxAllowedQuantityPerOrder
          allowOrderingIfNoStock
        }
      }
    }
  `, {
    options: {
      refetchQueries: [
        'productWarehousingInfo',
      ],
    },
  }),
  withFormSchema({
    sku: {
      type: String,
      optional: true,
      label: 'SKU',
    },
    maxAllowedQuantityPerOrder: {
      type: Number,
      optional: true,
      label: 'Max. allowed quantity per order?',
    },
    allowOrderingIfNoStock: {
      type: Boolean,
      optional: true,
      label: 'Allow ordering if no stock quantities left?',
    },
  }),
  withFormModel(({ data: { product = {} } }) => ({ ...product })),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Warehousing settings saved', { type: toast.type.SUCCESS });
    },
    onSubmit: ({ productId, mutate, schema }) => ({ ...dirtyInput }) => mutate({
      variables: {
        warehousing: schema.clean(dirtyInput),
        productId,
      },
    }),
  }),
  withFormErrorHandlers,
  mapProps(({
    productId, mutate, data, ...rest
  }) => ({
    isEditingDisabled: !data.product || (data.product.status === 'DELETED'),
    ...rest,
  })),
  pure,
)(FormEditProductWarehousing);
