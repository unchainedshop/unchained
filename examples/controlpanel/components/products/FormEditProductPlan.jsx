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

const FormEditProductPlan = ({ isEditingDisabled, ...formProps }) => (
  <Segment>
    <AutoForm {...formProps}>
      <Grid>
        <Grid.Row>
          <Grid.Column width={16}>
            <AutoField
              name="usageCalculationType"
              disabled={isEditingDisabled}
            />
          </Grid.Column>

          <Grid.Column width={8}>
            <AutoField name="billingInterval" disabled={isEditingDisabled} />
          </Grid.Column>

          <Grid.Column width={8}>
            <AutoField
              placeholder={1}
              name="billingIntervalCount"
              disabled={isEditingDisabled}
            />
          </Grid.Column>

          <Grid.Column width={8}>
            <AutoField name="trialInterval" disabled={isEditingDisabled} />
          </Grid.Column>

          <Grid.Column width={8}>
            <AutoField
              placeholder={1}
              name="trialIntervalCount"
              disabled={isEditingDisabled}
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
  </Segment>
);

export default compose(
  graphql(gql`
    query productPlanInfo($productId: ID) {
      product(productId: $productId) {
        _id
        status
        ... on PlanProduct {
          plan {
            usageCalculationType
            billingIntervalCount
            billingInterval
            trialIntervalCount
            trialInterval
          }
        }
      }
    }
  `),
  graphql(
    gql`
      mutation updateProductPlan(
        $plan: UpdateProductPlanInput!
        $productId: ID!
      ) {
        updateProductPlan(plan: $plan, productId: $productId) {
          _id
          ... on PlanProduct {
            plan {
              usageCalculationType
              billingIntervalCount
              billingInterval
              trialIntervalCount
              trialInterval
            }
          }
        }
      }
    `,
    {
      options: {
        refetchQueries: ['productPlanInfo'],
      },
    }
  ),

  withFormSchema({
    usageCalculationType: {
      type: String,
      optional: false,
      label: 'Usage calculation type',
      allowedValues: ['LICENSED', 'METERED'],
    },
    billingInterval: {
      type: String,
      optional: false,
      label: 'Billing interval',
      allowedValues: ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'],
    },
    billingIntervalCount: {
      type: Number,
      optional: true,
      label: 'Billing interval units',
    },
    trialInterval: {
      type: String,
      optional: true,
      label: 'Trial interval',
      allowedValues: ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'],
    },
    trialIntervalCount: {
      type: Number,
      optional: true,
      label: 'Trual interval units',
    },
  }),
  withFormModel(({ data: { product = {} } }) => {
    if (!product) return {};
    return {
      usageCalculationType: product.plan?.usageCalculationType,
      billingIntervalCount: product.plan?.billingIntervalCount,
      billingInterval: product.plan?.billingInterval,
      trialIntervalCount: product.plan?.trialIntervalCount,
      trialInterval: product.plan?.trialInterval,
    };
  }),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('Plan settings saved', { type: toast.TYPE.SUCCESS });
    },
    onSubmit: ({ productId, mutate, schema }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          plan: schema.clean(dirtyInput),
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
)(FormEditProductPlan);
