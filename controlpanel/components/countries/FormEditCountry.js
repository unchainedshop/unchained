import React from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import { Button, Segment, Container } from 'semantic-ui-react';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormEditCountry = ({ currencies, removeCountry, ...formProps }) => (
  <Container>
    <AutoForm {...formProps} >
      <Segment attached="bottom">
        <AutoField name={'isoCode'} />
        <AutoField name={'isActive'} />
        <AutoField name={'defaultCurrencyId'} options={currencies} />
        <ErrorsField />
        <SubmitField value="Speichern" className="primary" />
        <Button type="normal" secondary floated="right" onClick={removeCountry}>Delete</Button>
      </Segment>
    </AutoForm>
  </Container>
);

export default compose(
  withRouter,
  graphql(gql`
    query country($countryId: ID!) {
      country(countryId: $countryId) {
        _id
        isoCode
        isActive
        defaultCurrency {
          _id
        }
      }
      currencies {
        _id
        isoCode
      }
    }
  `),
  graphql(gql`
    mutation updateCountry($country: UpdateCountryInput!, $countryId: ID!) {
      updateCountry(country: $country, countryId: $countryId) {
        _id
        isoCode
        isActive
        defaultCurrency {
          _id
        }
      }
    }
  `, {
    name: 'updateCountry',
    options: {
      refetchQueries: [
        'country',
        'countries',
      ],
    },
  }),
  graphql(gql`
    mutation removeCountry($countryId: ID!) {
      removeCountry(countryId: $countryId) {
        _id
      }
    }
  `, {
    name: 'removeCountry',
    options: {
      refetchQueries: [
        'countries',
      ],
    },
  }),
  withFormSchema({
    isoCode: {
      type: String,
      optional: false,
      label: 'ISO Country code',
    },
    defaultCurrencyId: {
      type: String,
      optional: true,
      label: 'Default Currency',
    },
    isActive: {
      type: Boolean,
      optional: false,
      label: 'Active',
    },
  }),
  withFormModel(({ data: { country: { defaultCurrency, ...country } = {} } }) => ({
    defaultCurrencyId: defaultCurrency && defaultCurrency._id,
    ...country,
  })),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Country saved', { type: toast.TYPE.SUCCESS }); // eslint-disable-line
    },
    removeCountry: ({ router, removeCountry, countryId }) => async (event) => {
      event.preventDefault();
      router.replace({ pathname: '/countries' });
      await removeCountry({
        variables: {
          countryId,
        },
      });
    },
    onSubmit: ({ countryId, updateCountry }) =>
      ({ isoCode, defaultCurrencyId, isActive }) => updateCountry({
        variables: {
          country: { isoCode, defaultCurrencyId, isActive },
          countryId,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({
    countryId, updateCountry, data: { currencies = [] }, ...rest
  }) => ({
    currencies: currencies.map(currency => ({
      label: currency.isoCode,
      value: currency._id,
    })),
    ...rest,
  })),
)(FormEditCountry);
