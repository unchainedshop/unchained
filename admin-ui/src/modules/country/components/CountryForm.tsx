import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import convertArrayOfObjectToObject from '../../common/convertArrayOfObjectToObject';
import useCurrencies from '../../currency/hooks/useCurrencies';
import Toggle from '../../common/components/Toggle';
import Form from '../../forms/components/Form';

import SelectField from '../../forms/components/SelectField';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm from '../../forms/hooks/useForm';
import { validateCountry } from '../../forms/lib/validators';

const CountryForm = ({
  onSubmit,
  onSubmitSuccess = null,
  defaultValue = {},
  isEdit = false,
}) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();

  const countryAddedMessage = formatMessage({
    id: 'country_added',
    defaultMessage: 'Country added successfully!',
  });
  const countryUpdatedMessage = formatMessage({
    id: 'country_updated',
    defaultMessage: 'Country updated successfully!',
  });

  const { currencies } = useCurrencies();
  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess,
    successMessage: isEdit ? countryUpdatedMessage : countryAddedMessage,
    getSubmitErrorMessage: (error) => {
      if (error?.message?.includes('duplicate key')) {
        form.formik.setFieldError(
          'isoCode',
          formatMessage({
            id: 'country_exists',
            defaultMessage: 'Country with the same ISO code already exists',
          }),
        );
        return null;
      }
    },
    enableReinitialize: true,
    initialValues: {
      isoCode: '',
      ...defaultValue,
    },
  });

  return (
    <Form form={form}>
      <div className="p-5 pb-7">
        <TextField
          name="isoCode"
          id="isoCode"
          validators={[validateCountry()]}
          label={formatMessage({
            id: 'iso_code',
            defaultMessage: 'ISO code',
          })}
          required
          autoComplete="on"
        />

        {isEdit && (
          <div className="my-3 min-w-0 flex-1">
            <SelectField
              name="defaultCurrencyCode"
              id="defaultCurrencyCode"
              label={formatMessage({
                id: 'default_currency',
                defaultMessage: 'Default currency',
              })}
              options={convertArrayOfObjectToObject(
                currencies,
                'isoCode',
                'isoCode',
              )}
              className="mb-2 text-sm"
            />
            <Toggle
              toggleText={formatMessage({
                id: 'active',
                defaultMessage: 'Active',
              })}
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
      {hasRole('manageCountries') && (
        <div className="space-y-6 border-t border-t-slate-100 dark:border-t-slate-700 bg-slate-50 dark:bg-slate-900 p-5 text-right">
          <SubmitButton
            label={
              isEdit
                ? formatMessage({
                    id: 'update_country',
                    defaultMessage: 'Update Country',
                  })
                : formatMessage({
                    id: 'add_country',
                    defaultMessage: 'Add Country',
                  })
            }
          />
        </div>
      )}
    </Form>
  );
};

export default CountryForm;
