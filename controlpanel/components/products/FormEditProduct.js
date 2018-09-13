import React from 'react';
import { toast } from 'react-toastify';
import {
  compose, pure, mapProps, withHandlers,
} from 'recompose';
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
import FormTagInput from '../../lib/FormTagInput';

const FormEditProduct = ({ isEditingDisabled, ...formProps }) => (
  <AutoForm {...formProps}>
    <Grid>
      <Grid.Row columns={1}>
        <Grid.Column width={12}>
          <AutoField
            name="tags"
            component={FormTagInput}
            disabled={isEditingDisabled}
            options={[]}
          />
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
);

export default compose(
  graphql(gql`
    query productMain($productId: ID) {
      product(productId: $productId) {
        _id
        tags
        status
      }
    }
  `),
  graphql(gql`
    mutation updateProduct($product: UpdateProductInput!, $productId: ID!) {
      updateProduct(product: $product, productId: $productId) {
        _id
        tags
      }
    }
  `, {
    options: {
      refetchQueries: [
        'productInfos',
        'getAllProducts',
      ],
    },
  }),
  withFormSchema(() => ({
    tags: {
      type: Array,
      optional: true,
      label: 'Tags (Product Segmentation)',
    },
    'tags.$': String,
  })),
  withFormModel(({ data: { product = {} } }) => ({ ...product })),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Tags saved', { type: toast.TYPE.SUCCESS });
    },
    onSubmit: ({ productId, mutate, schema }) => ({ ...dirtyInput }) => mutate({
      variables: {
        product: schema.clean(dirtyInput),
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
)(FormEditProduct);
