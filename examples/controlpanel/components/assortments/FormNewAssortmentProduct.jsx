import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import {
  Segment,
  Dropdown,
  Header,
  Image as SemanticImage,
} from 'semantic-ui-react';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { debounce, has } from 'lodash';
import { useQuery } from '@apollo/react-hooks';
import { connectField } from 'uniforms';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const SEARCH_PRODUCTS = gql`
  query search($queryString: String) {
    search(queryString: $queryString, includeInactive: true) {
      totalProducts
      products {
        _id
        texts {
          _id
          title
          description
        }
        media {
          texts {
            title
          }
          file {
            url
            name
          }
        }
      }
    }
  }
`;

const ProductSearchDropdown = ({ onChange, value }) => {
  const [queryString, setQueryString] = useState('');
  const { data, loading } = useQuery(SEARCH_PRODUCTS, {
    variables: {
      queryString,
    },
    skip: !queryString,
  });

  const handleOnChange = (e, result) => {
    onChange(result.value);
  };

  const handleSearchChange = (e, result) => {
    setQueryString(result.searchQuery);
  };

  const pollyfillImageUrl = 'https://via.placeholder.com/150';

  const selectImage = (result) => {
    if (!result.media) return pollyfillImageUrl;

    const foundImageObj = result.media.find((mediaObj) => {
      if (has(mediaObj, 'file.url')) {
        const imageObj = new Image();
        imageObj.src = mediaObj.file.url;
        return imageObj.complete;
      }
      return false;
    });
    return (
      (foundImageObj && foundImageObj.file && foundImageObj.file.url) ||
      pollyfillImageUrl
    );
  };

  const options =
    data?.search?.products.map((opt) => {
      return {
        key: opt.texts._id,
        value: opt.texts._id,
        text: opt.texts.title,
        content: (
          <Header>
            <SemanticImage src={selectImage(opt.media)} />
            <Header.Content>
              {opt.texts.title}
              <Header.Subheader>{opt.texts.description}</Header.Subheader>
            </Header.Content>
          </Header>
        ),
      };
    }) || [];
  return (
    <Dropdown
      search
      fluid
      clearable
      selection
      placeholder="Select Product"
      name="product"
      loading={loading}
      onChange={handleOnChange}
      onSearchChange={debounce(handleSearchChange, 500, {
        leading: true,
      })}
      options={options}
      value={value}
      style={{ marginBottom: '1em' }}
    />
  );
};

const ProductSearchDropdownField = connectField(ProductSearchDropdown);

const FormNewAssortmentProduct = ({
  products,
  removeCountry,
  ...formProps
}) => (
  <AutoForm {...formProps}>
    <Segment basic>
      <AutoField name={'assortmentId'} type="hidden" />
      <AutoField name={'productId'} options={products} />
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
      mutation addAssortmentProduct($assortmentId: ID!, $productId: ID!) {
        addAssortmentProduct(
          assortmentId: $assortmentId
          productId: $productId
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
  }),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Product added to assortment', { type: toast.TYPE.SUCCESS });
    },
    onSubmit: ({ addAssortmentProduct }) => ({ assortmentId, productId }) =>
      addAssortmentProduct({
        variables: {
          assortmentId,
          productId,
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
