import { useIntl } from 'react-intl';
import Form from '../../forms/components/Form';
import SelectField from '../../forms/components/SelectField';
import SubmitButton from '../../forms/components/SubmitButton';
import useForm from '../../forms/hooks/useForm';
import FormWrapper from './FormWrapper';

const NewProviderForm = ({
  onSubmit,
  onSubmitSuccess,
  providerTypes,
  providerInterfaces,
  onProviderChange,
  readOnly,
}) => {
  const { formatMessage } = useIntl();

  const createProviderMessage = formatMessage({
    id: 'provider_created_success',
    defaultMessage: 'Provider created successfully!',
  });

  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess,
    successMessage: createProviderMessage,
    enableReinitialize: true,
    initialValues: {
      adapterKey: '',
      type: '',
    },
  });

  return (
    <FormWrapper>
      <Form form={form}>
        <div className="shadow-sm dark:shadow-none sm:max-w-full sm:rounded-lg">
          <div className="px-4 pt-4 pb-6">
            <SelectField
              onChange={(e) => onProviderChange(e.target.value)}
              name="type"
              disabled={readOnly}
              required
              label={formatMessage({ id: 'type', defaultMessage: 'Type' })}
              options={providerTypes}
              className="mb-5"
            />
            <SelectField
              name="adapterKey"
              required
              disabled={readOnly}
              options={providerInterfaces}
              label={formatMessage({
                id: 'adapter',
                defaultMessage: 'Adapter',
              })}
              className="mt-2"
            />
          </div>
          {!readOnly && (
            <div className="border-t-slate-100 border-t dark:border-t-slate-700 space-y-6 bg-slate-50 dark:bg-slate-900 p-6 px-5 text-right">
              <SubmitButton
                label={formatMessage({
                  id: 'create_provider',
                  defaultMessage: 'Create provider',
                })}
              />
            </div>
          )}
        </div>
      </Form>
    </FormWrapper>
  );
};

export default NewProviderForm;
