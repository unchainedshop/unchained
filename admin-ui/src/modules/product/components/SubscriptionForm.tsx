import { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import useAuth from '../../Auth/useAuth';

import FormWrapper from '../../common/components/FormWrapper';
import SelfDocumentingView from '../../common/components/SelfDocumentingView';
import convertArrayOfObjectToObject from '../../common/convertArrayOfObjectToObject';
import Form from '../../forms/components/Form';
import SelectField from '../../forms/components/SelectField';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useProductPlan from '../hooks/useProductPlan';
import useProductPlanConfigurationOptions from '../hooks/useProductPlanConfigurationOptions';
import useUpdateProductPlan from '../hooks/useUpdateProductPlan';

const SubscriptionForm = ({ productId, disabled = false }) => {
  const { formatMessage } = useIntl();
  const { configurationIntervals, usageCalculationTypes } =
    useProductPlanConfigurationOptions();
  const { plan, loading } = useProductPlan({ productId });
  const { hasRole } = useAuth();
  const { updateProductPlan } = useUpdateProductPlan();
  const successMessage = formatMessage({
    id: 'enrollment_updated_successfully',
    defaultMessage: 'Enrollment saved successfully',
  });

  const onSubmit: OnSubmitType = async ({
    trialInterval,
    trialIntervalCount,
    billingInterval,
    billingIntervalCount,
    usageCalculationType,
  }) => {
    await updateProductPlan({
      productId,
      plan: {
        billingInterval,
        usageCalculationType,
        billingIntervalCount,
        trialInterval,
        trialIntervalCount,
      },
    });
    return { success: true };
  };

  const form = useForm({
    disabled,
    submit: onSubmit,
    successMessage,
    initialValues: {
      trialInterval: '',
      trialIntervalCount: '',
      billingInterval: '',
      billingIntervalCount: '',
      usageCalculationType: '',
    },
    getSubmitErrorMessage: (error) => {
      if (
        error?.message?.includes(
          'Status of the product does not allow this operation',
        )
      )
        return formatMessage({
          id: 'subscription_product_type_not_valid',
          defaultMessage: 'Status of the product does not allow this operation',
        });

      return error?.message || '';
    },
  });

  useEffect(() => {
    if (plan && !loading) form.formik.setValues(plan);
  }, [plan]);

  return (
    <SelfDocumentingView
      documentationLabel={formatMessage({
        id: 'subscription',
        defaultMessage: 'Subscription',
      })}
      className="mt-2 lg:mt-5"
      documentation={
        <FormattedMessage
          id="product_subscription_form_description"
          defaultMessage="<ul><li> Information that will be used to calculate price of a subscription based product </li>
          <li>The price specified in commerce section will be used when calculating fees on each interval. </li>
          <li>Price will not be included for the specified trial period </li> </ul>"
          values={{
            ul: (chunk) => <ul className="space-y-1">{chunk} </ul>,
            li: (chunk) => <li>{chunk}</li>,
          }}
        />
      }
    >
      <FormWrapper>
        <Form form={form}>
          <div className="relative max-w-full space-y-6 rounded-md sm:p-6">
            <SelectField
              required
              className="mt-2.5 w-full py-1.5 text-sm font-medium text-slate-500"
              label={formatMessage({
                id: 'usage_calculation_type',
                defaultMessage: 'Usage calculation type',
              })}
              placeholder={formatMessage({
                id: 'usage_calculation_type',
                defaultMessage: 'Usage calculation type',
              })}
              name="usageCalculationType"
              options={convertArrayOfObjectToObject(
                usageCalculationTypes,
                'value',
                'value',
              )}
            />
            <div className="w-full items-end justify-end sm:flex">
              <SelectField
                className="mt-2.5 w-full text-sm font-medium text-slate-500"
                required
                label={formatMessage({
                  id: 'billing_interval_unit',
                  defaultMessage: 'Billing interval unit',
                })}
                placeholder={formatMessage({
                  id: 'billing_interval_unit',
                  defaultMessage: 'Billing interval unit',
                })}
                name="billingInterval"
                options={convertArrayOfObjectToObject(
                  configurationIntervals,
                  'value',
                  'value',
                )}
              />
              <TextField
                name="billingIntervalCount"
                id="billing_unit"
                type="number"
                required
                label={formatMessage({
                  id: 'billing_unit',
                  defaultMessage: 'Billing Unit',
                })}
                placeholder={formatMessage({
                  id: 'billing_unit',
                  defaultMessage: 'Billing Unit',
                })}
                className="mt-1  w-full text-sm  font-medium text-slate-500 sm:ml-1"
              />
            </div>

            <div className="max-w-full items-end  justify-end sm:flex">
              <SelectField
                className="mt-2.5  w-full text-sm  font-medium text-slate-500"
                label={formatMessage({
                  id: 'trial_interval_unit',
                  defaultMessage: 'Trial interval unit',
                })}
                placeholder={formatMessage({
                  id: 'trial_interval_unit',
                  defaultMessage: 'Trial interval unit',
                })}
                name="trialInterval"
                options={convertArrayOfObjectToObject(
                  configurationIntervals,
                  'value',
                  'value',
                )}
              />
              <TextField
                type="number"
                name="trialIntervalCount"
                id="trialIntervalCount "
                label={formatMessage({
                  id: 'trial_unit',
                  defaultMessage: 'Trial Unit',
                })}
                placeholder={formatMessage({
                  id: 'trial_unit',
                  defaultMessage: 'Trial Unit',
                })}
                required
                className="mt-1  w-full text-sm   font-medium text-slate-500 sm:ml-1"
              />
            </div>

            <div className="-mx-6 -mb-6 mt-6 border-t-slate-100 border-t space-y-6 bg-slate-50 dark:bg-slate-500 text-right sm:p-6">
              <SubmitButton
                hidden={!hasRole('addEnrollment')}
                label={formatMessage({
                  id: 'save',
                  defaultMessage: 'Save',
                })}
              />
            </div>
          </div>
        </Form>
      </FormWrapper>
    </SelfDocumentingView>
  );
};

export default SubscriptionForm;
