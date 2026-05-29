import { useIntl } from 'react-intl';

import JSONAreaField from '@/components/ui/form/JSONAreaField';
import SubmitButton from '@/components/ui/form/SubmitButton';
import useForm from '../../forms/hooks/useForm';
import Form from '../../forms/components/Form';
import FormErrors from '@/components/ui/form/FormErrors';

const ProviderConfigurationForm = ({
  onSubmit,
  onSubmitSuccess,
  provider,
  disabled,
}) => {
  const { formatMessage } = useIntl();
  const form = useForm({
    initialValues: {
      configuration: JSON.stringify(provider?.configuration || {}, null, 2),
    },
    submit: onSubmit,
    getSubmitErrorMessage: (error) => {
      return error?.message || '';
    },
    onSubmitSuccess,
  });
  return (
    <Form form={form} className="mt-6">
      <div className="mt-1 sm:mt-0">
        <JSONAreaField
          id="configuration"
          name="configuration"
          disabled={disabled}
          value={form.formik.values.configuration}
          label={formatMessage({
            id: 'configuration',
            defaultMessage: 'Configuration',
          })}
        />
        <FormErrors />
        {!disabled && (
          <SubmitButton
            label={formatMessage({
              id: 'update_configuration',
              defaultMessage: 'Update configuration',
            })}
            className="mt-3"
          />
        )}
      </div>
    </Form>
  );
};

export default ProviderConfigurationForm;
