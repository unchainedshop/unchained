import React from 'react';
import { toast } from 'react-toastify';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { Segment, Form } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import AutoForm from 'uniforms-semantic/AutoForm';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import ListField from 'uniforms-semantic/ListField';
import ListDelField from 'uniforms-semantic/ListDelField';
import ListAddField from 'uniforms-semantic/ListAddField';
import NestField from 'uniforms-semantic/NestField';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormEditProductCommerce = ({
  isEditingDisabled,
  model,
  ...formProps
}) => (
  <Segment>
    <AutoForm model={model} {...formProps}>
      <Form.Group inline>
        <Form.Field width={1}>&nbsp;</Form.Field>
        <Form.Field width={3}>Country / Currency</Form.Field>
        <Form.Field width={2}>Vat suspect?</Form.Field>
        <Form.Field width={2}>Net price?</Form.Field>
        <Form.Field width={4}>Max Quantity</Form.Field>
        <Form.Field width={4}>Amount</Form.Field>
      </Form.Group>
      <ListField name="pricing" label={false}>
        <NestField grouped={false} name="$">
          <Form.Field width={1}>
            <ListDelField />
          </Form.Field>
          <AutoField
            className="three wide"
            name="countryCurrency"
            label={false}
          />
          <AutoField className="two wide" name="isTaxable" label={false} />
          <AutoField className="two wide" name="isNetPrice" label={false} />
          <AutoField className="four wide" name="maxQuantity" label={false} />
          <AutoField className="four wide" name="amount" label={false} />
          <AutoField name="currencyCode" type="hidden" label={false} />
          <AutoField name="countryCode" type="hidden" label={false} />
        </NestField>
      </ListField>
      <Form.Group>
        <Form.Field width={15} />
        <Form.Field width={1}>
          <ListAddField name="pricing.$" />
        </Form.Field>
      </Form.Group>
      <ErrorsField />
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
    query productCommerceInfo($productId: ID!) {
      countries {
        _id
        isoCode
        defaultCurrency {
          _id
          isoCode
        }
      }
      product(productId: $productId) {
        _id
        status
      }
      productCatalogPrices(productId: $productId) {
        _id
        isTaxable
        isNetPrice
        maxQuantity
        country {
          _id
          isoCode
        }
        price {
          amount
          currency
        }
      }
    }
  `),
  graphql(
    gql`
      mutation updateProductCommerce(
        $commerce: UpdateProductCommerceInput!
        $productId: ID!
      ) {
        updateProductCommerce(commerce: $commerce, productId: $productId) {
          _id
        }
      }
    `,
    {
      options: {
        refetchQueries: ['productCommerceInfo'],
      },
    }
  ),
  withFormSchema(({ data: { countries } }) => ({
    pricing: {
      type: Array,
      minCount: 1,
    },
    'pricing.$': {
      type: Object,
    },
    'pricing.$.countryCurrency': {
      type: String,
      allowedValues: (countries || []).reduce(
        (allCombinations, country) => [
          ...allCombinations,
          `${country.isoCode} / ${
            country.defaultCurrency && country.defaultCurrency.isoCode
          }`,
        ],
        [null]
      ),
    },
    'pricing.$.countryCode': {
      optional: true,
      type: String,
    },
    'pricing.$.currencyCode': {
      optional: true,
      type: String,
    },
    'pricing.$.maxQuantity': {
      type: Number,
    },
    'pricing.$.isTaxable': {
      type: Boolean,
      optional: true,
    },
    'pricing.$.isNetPrice': {
      type: Boolean,
      optional: true,
    },
    'pricing.$.amount': {
      type: Number,
      defaultValue: 0,
    },
  })),
  withFormModel(({ data: { countries, productCatalogPrices } = {} }) => {
    const productPricing = productCatalogPrices || [];
    const productPricingMap = {};
    const burnedIds = [];
    productPricing.forEach(
      ({ _id, country, price, isTaxable, isNetPrice, maxQuantity }) => {
        burnedIds.push(`${country.isoCode}:${price.currency}`);
        productPricingMap[_id] = {
          countryCode: country.isoCode,
          amount: price.amount,
          currencyCode: price.currency,
          maxQuantity: maxQuantity || 0,
          isTaxable,
          isNetPrice,
        };
      }
    );

    const defaultPairs = countries || [];
    defaultPairs.forEach((country) => {
      const price = {
        countryCode: country.isoCode,
        currencyCode:
          country.defaultCurrency && country.defaultCurrency.isoCode,
        maxQuantity: 0,
        isTaxable: true,
        isNetPrice: false,
      };
      const id = `${price.countryCode}:${price.currencyCode}`;
      if (!burnedIds.includes(id)) {
        productPricingMap[id] = price;
      }
    });

    const pricing = Object.keys(productPricingMap)
      .map(
        (key) =>
          productPricingMap[key] && {
            countryCurrency: `${productPricingMap[key].countryCode} / ${productPricingMap[key].currencyCode}`,
            ...productPricingMap[key],
          }
      )
      .filter(Boolean)
      .sort((left, right) => {
        if (left.countryCurrency === right.countryCurrency) {
          return Math.max(left.maxQuantity, 0) - Math.max(right.maxQuantity, 0);
        }
        return 0;
      });

    return { pricing };
  }),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Commerce settings saved', { type: toast.TYPE.SUCCESS });
    },
    onSubmit: ({ productId, mutate, schema }) => ({ pricing }) => {
      const newPricing = pricing.map(({ countryCurrency, ...rest }) => ({
        countryCode: countryCurrency.split(' / ')[0],
        currencyCode: countryCurrency.split(' / ')[1],
        ...rest,
      }));
      return mutate({
        variables: {
          commerce: schema.clean({ pricing: newPricing }),
          productId,
        },
      });
    },
  }),
  withFormErrorHandlers,
  mapProps(({ productId, mutate, data, ...rest }) => ({
    isEditingDisabled: !data.product || data.product.status === 'DELETED',
    ...rest,
  })),
  pure
)(FormEditProductCommerce);
