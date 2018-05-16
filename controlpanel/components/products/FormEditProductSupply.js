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

const FormEditProductSupply = ({ isEditingDisabled, ...formProps }) => (
  <Segment>
    <AutoForm {...formProps}>
      <Grid>
        <Grid.Row>
          <Grid.Column width={8}>
            <AutoField
              name="weightInGram"
              disabled={isEditingDisabled}
            />
          </Grid.Column>
          <Grid.Column width={8}>
            <AutoField
              name="lengthInMillimeters"
              disabled={isEditingDisabled}
            />
          </Grid.Column>
          <Grid.Column width={8}>
            <AutoField
              name="widthInMillimeters"
              disabled={isEditingDisabled}
            />
          </Grid.Column>
          <Grid.Column width={8}>
            <AutoField
              name="heightInMillimeters"
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
    query productSupplyInfo($productId: ID) {
      product(productId: $productId) {
        _id
        status
        ... on ProductSupply {
          dimensions {
            weight(unit: GRAM)
            length(unit: MILLIMETERS)
            width(unit: MILLIMETERS)
            height(unit: MILLIMETERS)
          }
        }
      }
    }
  `),
  graphql(gql`
    mutation updateProductSupply($supply: UpdateProductSupplyInput!, $productId: ID!) {
      updateProductSupply(supply: $supply, productId: $productId) {
        _id
        ... on ProductSupply {
          dimensions {
            weight(unit: GRAM)
            length(unit: MILLIMETERS)
            width(unit: MILLIMETERS)
            height(unit: MILLIMETERS)
          }
        }
      }
    }
  `, {
    options: {
      refetchQueries: [
        'productSupplyInfo',
      ],
    },
  }),
  withFormSchema({
    weightInGram: {
      type: Number,
      optional: true,
      label: 'Gewicht (Gram)',
    },
    lengthInMillimeters: {
      type: Number,
      optional: true,
      label: 'Länge (Millimeter)',
    },
    heightInMillimeters: {
      type: Number,
      optional: true,
      label: 'Höhe (Millimeter)',
    },
    widthInMillimeters: {
      type: Number,
      optional: true,
      label: 'Breite (Millimeter)',
    },
  }),
  withFormModel(({ data: { product = {} } }) => {
    if (!product || !product.dimensions) return {};
    return {
      weightInGram: product.dimensions && product.dimensions.weight,
      heightInMillimeters: product.dimensions && product.dimensions.height,
      lengthInMillimeters: product.dimensions && product.dimensions.length,
      widthInMillimeters: product.dimensions && product.dimensions.width,
    };
  }),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Supply settings saved', { type: toast.type.SUCCESS });
    },
    onSubmit: ({ productId, mutate, schema }) => ({ ...dirtyInput }) => mutate({
      variables: {
        supply: schema.clean(dirtyInput),
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
)(FormEditProductSupply);
