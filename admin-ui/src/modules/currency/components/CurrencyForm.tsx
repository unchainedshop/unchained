import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import useAuth from '../../Auth/useAuth';
import Toggle from '../../common/components/Toggle';
import Form from '../../forms/components/Form';

import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import SelectField from '../../forms/components/SelectField';
import useForm from '../../forms/hooks/useForm';
import { isContractAddress } from '../../forms/lib/validators';

const CurrencyForm = ({
  onSubmit,
  onSubmitSuccess = null,
  defaultValue = {},
  isEdit = false,
}) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();

  const currencyAddedMessage = formatMessage({
    id: 'currency_added',
    defaultMessage: 'Currency added successfully!',
  });
  const currencyUpdatedMessage = formatMessage({
    id: 'currency_updated',
    defaultMessage: 'Currency updated successfully!',
  });

  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess,
    successMessage: isEdit ? currencyUpdatedMessage : currencyAddedMessage,
    getSubmitErrorMessage: (error) => {
      if (error?.message?.includes('duplicate key')) {
        form.formik.setFieldError(
          'isoCode',
          formatMessage({
            id: 'currency_exists',
            defaultMessage: 'Currency with the same ISO code already exists',
          }),
        );
        return null;
      }
    },
    initialValues: {
      isoCode: '',
      contractAddress: '',
      isActive: false,
      decimals: 2,
      ...defaultValue,
    },
  });
  return (
    <Form form={form}>
      <div className="p-5 pb-7">
        <TextField
          name="isoCode"
          disabled={!hasRole(IRoleAction.ManageCurrencies)}
          id="isoCode"
          label={formatMessage({
            id: 'iso_code',
            defaultMessage: 'ISO code',
          })}
          autoComplete="on"
          required
        />

        <TextField
          name="contractAddress"
          disabled={!hasRole(IRoleAction.ManageCurrencies)}
          id="contractAddress"
          validators={[isContractAddress()]}
          label={formatMessage({
            id: 'contract_address',
            defaultMessage: 'Contract Address',
          })}
          autoComplete="on"
          className="mt-4"
        />

        <SelectField
          className="mt-4"
          label={formatMessage({
            id: 'decimals',
            defaultMessage: 'Decimals',
          })}
          required
          name="decimals"
          disabled={!hasRole(IRoleAction.ManageCurrencies)}
          options={Object.fromEntries(
            new Array(32).fill(null).map((_, i) => [i, `${i}`]),
          )}
        />

        {isEdit && (
          <div className="mt-5 flex items-center">
            <Toggle
              toggleText={formatMessage({
                id: 'active',
                defaultMessage: 'Active',
              })}
              disabled={!hasRole(IRoleAction.ManageCurrencies)}
              active={form.formik.values.isActive}
              onToggle={() =>
                form.formik.setFieldValue(
                  'isActive',
                  !form.formik.values.isActive,
                )
              }
            />
          </div>
        )}
      </div>
      {hasRole(IRoleAction.ManageCurrencies) && (
        <div className="border-t-slate-100 border-t dark:border-t-slate-700 space-y-6 rounded-b-md bg-slate-50 dark:bg-slate-900 p-5 text-right">
          <SubmitButton
            label={
              isEdit
                ? formatMessage({
                    id: 'update_currency',
                    defaultMessage: 'Update Currency',
                  })
                : formatMessage({
                    id: 'add_currency',
                    defaultMessage: 'Add Currency',
                  })
            }
          />
        </div>
      )}
    </Form>
  );
};

export default CurrencyForm;
