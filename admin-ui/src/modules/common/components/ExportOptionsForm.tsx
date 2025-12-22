import React, { useMemo } from 'react';
import Form from '../../forms/components/Form';
import CheckboxField from '../../forms/components/CheckboxField';
import useForm from '../../forms/hooks/useForm';
import SubmitButton from '../../forms/components/SubmitButton';
import { useIntl } from 'react-intl';

export type ExportOption = {
  key: string;
  label: string;
  defaultChecked?: boolean;
};

export default function ExportOptionsForm({
  options,
  onSubmit,
  loading = false,
  successMessage = '',
}) {
  const { formatMessage } = useIntl();
  const initialValues = useMemo(
    () =>
      options.reduce((acc, o) => {
        acc[o.key] = o.defaultChecked ?? true;
        return acc;
      }, {}),
    [options],
  );

  const handleSubmit = async (values) => {
    await onSubmit(values);
    return { success: true };
  };

  const form = useForm({
    successMessage:
      successMessage ||
      formatMessage({
        id: 'export_completed',
        defaultMessage: 'Data exported successfully',
      }),
    submit: handleSubmit,
    enableReinitialize: true,
    initialValues,
  });

  return (
    <Form form={form}>
      {form.formik.isSubmitting ? (
        <div className="flex items-center gap-3 p-4 mb-4 rounded-lg animate-pulse">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {formatMessage({
              id: 'exporting_message',
              defaultMessage:
                'Generating your export files. This may take a moment...',
            })}
          </span>
        </div>
      ) : (
        <fieldset disabled={loading} style={{ border: 'none', padding: 0 }}>
          <h3>
            {' '}
            {formatMessage({
              id: 'export_options',
              defaultMessage: 'Export options',
            })}
          </h3>

          {options.map((o) => (
            <CheckboxField
              name={o.key}
              key={o.key}
              label={o.label}
              hideLabel
              className="mr-2 h-4 w-4 justify-between rounded-sm border-slate-300 dark:border-slate-600 bg-white text-slate-950 focus:ring-slate-800 lg:items-center"
              type="checkbox"
            />
          ))}

          <SubmitButton
            label={formatMessage({ id: 'submit', defaultMessage: 'Submit' })}
            disabled={loading}
          />
        </fieldset>
      )}
    </Form>
  );
}
