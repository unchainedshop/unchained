import React from 'react';
import { toast } from 'react-toastify';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { Segment, Table, Form } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormEditProductCommerce = ({ isEditingDisabled, model, ...formProps }) => (
  <Segment>
    <AutoForm model={model} {...formProps}>
      <Table celled columns={4}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell colSpan={4}>
              Amounts are always respected as their smallest
              possible currency unit. CHF 50.80 = 5080
            </Table.HeaderCell>
          </Table.Row>
          <Table.Row>
            <Table.HeaderCell>Country / Currency</Table.HeaderCell>
            <Table.HeaderCell>Nettopreis?</Table.HeaderCell>
            <Table.HeaderCell>Ust.-pflichtig?</Table.HeaderCell>
            <Table.HeaderCell>Price</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {model.pricing && model.pricing.map((item, key) => (
            <Table.Row key={item.countryCode}>
              <Table.Cell>
                <Form.Field>
                  <label htmlFor={`pricing.${key}.countryCode`}>
                    {item.countryCode} / {item.currencyCode}
                    <AutoField
                      name={`pricing.${key}.countryCode`}
                      hidden
                      label={false}
                      className="col-md-6"
                      disabled
                    />
                    <AutoField
                      name={`pricing.${key}.currencyCode`}
                      hidden
                      label={false}
                      disabled
                    />
                  </label>
                </Form.Field>
              </Table.Cell>
              <Table.Cell>
                <AutoField
                  name={`pricing.${key}.isNetPrice`}
                  label={false}
                  disabled={isEditingDisabled}
                />
              </Table.Cell>
              <Table.Cell>
                <AutoField
                  name={`pricing.${key}.isTaxable`}
                  label={false}
                  disabled={isEditingDisabled}
                />
              </Table.Cell>
              <Table.Cell>
                <AutoField
                  name={`pricing.${key}.amount`}
                  label={false}
                  disabled={isEditingDisabled}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <ErrorsField />
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
  graphql(gql`
    mutation updateProductCommerce($commerce: UpdateProductCommerceInput!, $productId: ID!) {
      updateProductCommerce(commerce: $commerce, productId: $productId) {
        _id
      }
    }
  `, {
    options: {
      refetchQueries: [
        'productCommerceInfo',
      ],
    },
  }),
  withFormSchema(() => ({
    pricing: {
      type: Array,
      minCount: 1,
    },
    'pricing.$': {
      type: Object,
    },
    'pricing.$.countryCode': {
      type: String,
    },
    'pricing.$.currencyCode': {
      type: String,
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
    productPricing.forEach(({
      country, price, isTaxable, isNetPrice,
    }) => {
      productPricingMap[`${country.isoCode}:${price.currency}`] = {
        countryCode: country.isoCode,
        isTaxable,
        isNetPrice,
        amount: price.amount,
        currencyCode: price.currency,
      };
    });
    const pricing = (countries || []).map(country => ({
      countryCode: country.isoCode,
      currencyCode: country.defaultCurrency && country.defaultCurrency.isoCode,
      ...productPricingMap[`${country.isoCode}:${country.defaultCurrency && country.defaultCurrency.isoCode}`],
    }));
    return { pricing };
  }),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Commerce settings saved', { type: toast.type.SUCCESS });
    },
    onSubmit: ({ productId, mutate, schema }) => ({ ...dirtyInput }) => mutate({
      variables: {
        commerce: schema.clean(dirtyInput),
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
)(FormEditProductCommerce);
