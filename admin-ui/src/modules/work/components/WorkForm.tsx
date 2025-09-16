import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import convertArrayOfObjectToObject from '../../common/convertArrayOfObjectToObject';

import DatePickerField from '../../forms/components/DatePickerField';
import Form from '../../forms/components/Form';
import JSONAreaField from '../../forms/components/JSONAreaField';
import SelectField from '../../forms/components/SelectField';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm, {
  OnSubmitSuccessType,
  OnSubmitType,
} from '../../forms/hooks/useForm';
import useAddWork from '../hooks/useAddWork';
import useRegisteredWorkTypes from '../hooks/useRegisteredWorkTypes';

const WorkForm = () => {
  const { formatMessage, locale } = useIntl();
  const { workTypes } = useRegisteredWorkTypes();
  const { hasRole } = useAuth();
  const { addWork } = useAddWork();
  const router = useRouter();
  const successMessage = formatMessage({
    id: 'work_added_success',
    defaultMessage: 'Work added successfully!',
  });

  const onSubmitSuccess: OnSubmitSuccessType = (_, { _id }) => {
    router.replace(`/works?workerId=${_id}`);
    return true;
  };

  const onSubmit: OnSubmitType = async ({
    type,
    retries: inputRetry,
    priority: inputPriority,
    input: userInput,
    scheduled,
    originalWorkId,
  }) => {
    const parsedRetry = parseInt(inputRetry, 10);
    const parsedPriority = parseInt(inputPriority, 10);

    const { data, error } = await addWork({
      type,
      retries: Number.isNaN(parsedRetry) ? undefined : parsedRetry,
      priority: Number.isNaN(parsedPriority) ? undefined : parsedPriority,
      input: JSON.parse(userInput || '[]'),
      scheduled,
      originalWorkId,
    });
    if (error) return { success: false };
    return { success: true, data: data?.addWork };
  };

  const form = useForm({
    submit: onSubmit,
    successMessage,
    onSubmitSuccess,
    enableReinitialize: true,
    initialValues: {
      priority: '',
      retries: '',
      originalWorkId: null,
      scheduled: '',
      type: '',
      input: '{}',
    },
  });

  return (
    <FormWrapper>
      <Form form={form}>
        <div className="relative max-w-full space-y-6 rounded-md p-6">
          <div className="max-w-4xl justify-between align-baseline sm:flex">
            <SelectField
              className="w-full py-2 text-sm text-slate-900 sm:mt-0"
              label={formatMessage({ id: 'type', defaultMessage: 'Type' })}
              labelClassName="text-sm font-medium text-slate-500 mb-1"
              name="type"
              required
              options={convertArrayOfObjectToObject(
                workTypes,
                'label',
                'value',
              )}
            />
          </div>
          <div className="max-w-4xl justify-between  align-baseline sm:flex sm:gap-4">
            <TextField
              name="priority"
              id="priority"
              label={formatMessage({
                id: 'priority',
                defaultMessage: 'Priority',
              })}
              labelClassName="text-sm font-medium text-slate-500 mb-1"
              type="number"
              className="w-full py-2 text-sm text-slate-900 sm:mt-0"
            />

            <TextField
              name="retries"
              id="retries"
              label={formatMessage({
                id: 'retries',
                defaultMessage: 'Retries',
              })}
              labelClassName="text-sm  font-medium text-slate-500 mb-1"
              type="number"
              className="w-full py-2 text-sm text-slate-900 sm:mt-0"
            />
          </div>

          <div className="max-w-4xl justify-between align-baseline sm:flex sm:gap-4">
            <TextField
              name="originalWorkId"
              id="original_work_id"
              label={formatMessage({
                id: 'original_work_id',
                defaultMessage: 'Original Work Id',
              })}
              labelClassName="text-sm font-medium text-slate-500 mb-1"
              autoComplete="on"
              className="w-full py-2 text-sm text-slate-900 sm:mt-0"
            />

            <DatePickerField
              label={formatMessage({
                id: 'scheduled',
                defaultMessage: 'Scheduled',
              })}
              labelClassName="text-sm font-medium text-slate-500 mb-1"
              className="w-full py-2 text-sm text-slate-900 dark:text-slate-200 dark:bg-slate-900 sm:mt-0 "
              containerClassName="w-full py-2 text-sm text-slate-900 sm:mt-0"
              name="scheduled"
              locale={locale}
              showTimeInput
              timeFormat="p"
              timeIntervals={15}
            />
          </div>

          <div>
            <JSONAreaField
              name="input"
              className="dark:text-slate-200"
              labelClassName="font-sm text-slate-500 mb-1"
              label={formatMessage({
                id: 'input',
                defaultMessage: 'Input',
              })}
            />
          </div>
        </div>

        <div className="border-t-slate-100 border-t dark:border-t-slate-700 space-y-6 bg-slate-50 dark:bg-slate-900 p-5 text-right">
          <SubmitButton
            hidden={!hasRole('addWork')}
            label={formatMessage({
              id: 'add_work',
              defaultMessage: 'Add Work',
            })}
          />
        </div>
      </Form>
    </FormWrapper>
  );
};

export default WorkForm;
