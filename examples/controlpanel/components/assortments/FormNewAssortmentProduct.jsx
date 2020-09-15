import React from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import { Segment } from 'semantic-ui-react';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import { connectField } from 'uniforms';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import SearchDropdown from '../SearchDropdown';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import FormTagInput from '../FormTagInput';

const ProductSearchDropdownField = connectField(SearchDropdown);

const FormNewAssortmentProduct = ({
  products,
  removeCountry,
  ...formProps
}) => (
  <AutoForm {...formProps}>
    <Segment basic>
      <AutoField name={'assortmentId'} type="hidden" />
      <AutoField name={'productId'} options={products} uniforms />
      <AutoField name="tags" component={FormTagInput} options={[]} />
      <ErrorsField />
      <SubmitField value="Add Product" className="primary" />
    </Segment>
  </AutoForm>
);

export default compose(
  withRouter,
  graphql(gql`
    query products {
      products(offset: 0, limit: 0) {
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
      mutation addAssortmentProduct(
        $assortmentId: ID!
        $productId: ID!
        $tags: [String!]
      ) {
        addAssortmentProduct(
          assortmentId: $assortmentId
          productId: $productId
          tags: $tags
        ) {
          _id
        }
      }
    `,
    {
      name: 'addAssortmentProduct',
      options: {
        refetchQueries: ['assortment', 'assortmentProducts'],
      },
    }
  ),
  withFormSchema({
    assortmentId: {
      type: String,
      label: null,
      optional: false,
    },
    productId: {
      type: String,
      optional: false,
      label: 'Product',
      uniforms: {
        component: ProductSearchDropdownField,
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
      toast('Product added to assortment', { type: toast.TYPE.SUCCESS });
    },
    onSubmit: ({ addAssortmentProduct }) => ({
      assortmentId,
      productId,
      tags,
    }) =>
      addAssortmentProduct({
        variables: {
          assortmentId,
          productId,
          tags,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(
    ({
      assortmentId,
      addAssortmentProduct,
      data: { products = [] },
      ...rest
    }) => ({
      products: [{ label: 'Select', value: false }].concat(
        products.map((product) => ({
          label: product.texts.title,
          value: product._id,
        }))
      ),
      model: {
        assortmentId,
      },
      ...rest,
    })
  )
)(FormNewAssortmentProduct);
