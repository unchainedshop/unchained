import React from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import { Segment, Button, Container } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { withRouter } from 'next/router';
import { graphql } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormEditCurrency = ({ removeCurrency, ...formProps }) => (
  <Container>
    <AutoForm {...formProps}>
      <Segment attached="bottom">
        <AutoField name={'isoCode'} />
        <AutoField name={'isActive'} />
        <ErrorsField />
        <SubmitField value="Save" className="primary" />
        <Button
          type="normal"
          secondary
          floated="right"
          onClick={removeCurrency}
        >
          Delete
        </Button>
      </Segment>
    </AutoForm>
  </Container>
);

export default compose(
  withRouter,
  graphql(gql`
    query currency($currencyId: ID!) {
      currency(currencyId: $currencyId) {
        _id
        isoCode
        isActive
        name
      }
    }
  `),
  graphql(
    gql`
      mutation updateCurrency(
        $currency: UpdateCurrencyInput!
        $currencyId: ID!
      ) {
        updateCurrency(currency: $currency, currencyId: $currencyId) {
          _id
          isoCode
          isActive
        }
      }
    `,
    {
      name: 'updateCurrency',
      options: {
        refetchQueries: ['currency', 'currencies'],
      },
    }
  ),
  graphql(
    gql`
      mutation removeCurrency($currencyId: ID!) {
        removeCurrency(currencyId: $currencyId) {
          _id
        }
      }
    `,
    {
      name: 'removeCurrency',
      options: {
        refetchQueries: ['currencies'],
      },
    }
  ),
  withFormSchema({
    isoCode: {
      type: String,
      optional: false,
      label: 'ISO Währungscode',
    },
    isActive: {
      type: Boolean,
      optional: false,
      label: 'Active?',
    },
  }),
  withFormModel(({ data: { currency = {} } }) => currency),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Currency saved', { type: toast.TYPE.SUCCESS });
    },
    removeCurrency: ({ router, currencyId, removeCurrency }) => async (
      event
    ) => {
      event.preventDefault();
      router.replace({ pathname: '/currencies' });
      await removeCurrency({
        variables: {
          currencyId,
        },
      });
    },
    onSubmit: ({ currencyId, updateCurrency, schema }) => ({ ...dirtyInput }) =>
      updateCurrency({
        variables: {
          currency: schema.clean(dirtyInput),
          currencyId,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ currencyId, updateCurrency, data, ...rest }) => ({
    ...rest,
  }))
)(FormEditCurrency);
