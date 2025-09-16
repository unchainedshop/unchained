import { useIntl } from 'react-intl';

import JSONAreaField from '../../forms/components/JSONAreaField';
import SubmitButton from '../../forms/components/SubmitButton';
import useForm from '../../forms/hooks/useForm';
import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';

const ProviderConfigurationForm = ({
  onSubmit,
  onSubmitSuccess,
  provider,
  readOnly,
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
          value={form.formik.values.configuration}
          label={formatMessage({
            id: 'configuration',
            defaultMessage: 'Configuration',
          })}
        />
        <FormErrors />
        <SubmitButton
          hidden={readOnly}
          label={formatMessage({
            id: 'update_configuration',
            defaultMessage: 'Update configuration',
          })}
          className="mt-3"
        />
      </div>
    </Form>
  );
};

export default ProviderConfigurationForm;
