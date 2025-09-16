import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import Form from '../../forms/components/Form';

import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';

const FilterOptionForm = ({
  onCancel,
  onSubmit,
}: {
  onSubmit: OnSubmitType;
  onCancel: any;
}) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const successMessage = formatMessage({
    id: 'filter_option_added_success',
    defaultMessage: 'Filter option added successfully',
  });

  const form = useForm({
    submit: onSubmit,
    successMessage,
    initialValues: {
      title: '',
      value: '',
    },
  });
  return (
    <Form form={form}>
      <div className="flex gap-2">
        <TextField
          name="value"
          label={formatMessage({
            id: 'filter_option_value',
            defaultMessage: 'Value',
          })}
          required
        />
        <TextField
          name="title"
          label={formatMessage({
            id: 'filter_option_title',
            defaultMessage: 'Title',
          })}
          required
        />
      </div>

      <div className="mt-5 flex justify-end">
        <button
          onClick={onCancel}
          type="button"
          className="mr-2 rounded-md border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm font-medium leading-5 text-slate-700 dark:text-slate-500 shadow-xs"
        >
          {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
        </button>
        <span className="flex items-center">
          <SubmitButton
            className="m-auto w-full"
            label={formatMessage({
              id: 'add_filter_option',
              defaultMessage: 'Add option',
            })}
          />
        </span>
      </div>
    </Form>
  );
};

export default FilterOptionForm;
