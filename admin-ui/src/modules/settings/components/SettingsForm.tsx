import { useIntl } from 'react-intl';

import Form from '../../forms/components/Form';
import SubmitButton from '@/components/ui/form/SubmitButton';
import FormErrors from '@/components/ui/form/FormErrors';
import useForm from '../../forms/hooks/useForm';
import SchemaField from './SchemaField';

interface SettingsFormProps {
  schema: Record<string, unknown>;
  values: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<any>;
  disabled?: boolean;
}

const SettingsForm = ({
  schema,
  values,
  onSubmit,
  disabled,
}: SettingsFormProps) => {
  const { formatMessage } = useIntl();

  const properties = (schema?.properties || {}) as Record<
    string,
    Record<string, unknown>
  >;

  const form = useForm({
    submit: onSubmit,
    initialValues: values || {},
    successMessage: formatMessage({
      id: 'settings_updated',
      defaultMessage: 'Settings updated successfully!',
    }),
    enableReinitialize: true,
  });

  return (
    <Form form={form}>
      <div className="p-5 pb-7 space-y-4">
        {Object.entries(properties).map(([key, propSchema]) => (
          <SchemaField
            key={key}
            name={key}
            schema={propSchema}
            disabled={disabled}
          />
        ))}
      </div>
      <FormErrors />
      {!disabled && (
        <div className="space-y-6 border-t border-t-border-subtle bg-surface-subtle p-5 text-right">
          <SubmitButton
            label={formatMessage({
              id: 'save_settings',
              defaultMessage: 'Save settings',
            })}
          />
        </div>
      )}
    </Form>
  );
};

export default SettingsForm;
