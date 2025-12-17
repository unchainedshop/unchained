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
    const data = await onSubmit(values);
    return { success: true, data };
  };

  const form = useForm({
    submit: handleSubmit,
    enableReinitialize: true,
    initialValues,
  });

  return (
    <Form form={form}>
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
            className="mr-2 h-4 w-4 justify-between rounded-sm border-slate-300 dark:border-slate-600 bg-white dark:!bg-slate-900 text-slate-950 focus:ring-slate-800 lg:items-center"
            type="checkbox"
          />
        ))}

        <SubmitButton label={'submit'} />
      </fieldset>
    </Form>
  );
}
