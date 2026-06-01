import { useRouter } from 'next/router';
import { IWork } from '../../../gql/types';
import { useIntl } from 'react-intl';
import FormWrapper from '../../common/components/FormWrapper';
import DatePickerField from '@/components/ui/form/DatePickerField';
import Form from '../../forms/components/Form';
import JSONAreaField from '@/components/ui/form/JSONAreaField';
import SubmitButton from '@/components/ui/form/SubmitButton';
import TextField from '@/components/ui/form/TextField';
import useForm, {
  OnSubmitSuccessType,
  OnSubmitType,
} from '../../forms/hooks/useForm';

const RetryForm = ({
  work,
  onSubmit,
}: {
  work: IWork;
  onSubmit: OnSubmitType;
}) => {
  const { formatMessage, locale } = useIntl();
  const router = useRouter();

  const successMessage = formatMessage({
    id: 'work_added_success',
    defaultMessage: 'Work added successfully!',
  });

  const onSubmitSuccess: OnSubmitSuccessType = (_, { _id }) => {
    router.replace(`/works?workerId=${_id}`);
    return true;
  };

  const form = useForm({
    submit: onSubmit,
    successMessage,
    onSubmitSuccess,
    enableReinitialize: true,
    initialValues: {
      ...work,
      input: JSON.stringify(work?.input || {}, null, 2),
    },
  });

  return (
    <FormWrapper>
      <Form form={form}>
        <div className="space-y-6 rounded-md bg-surface-input shadow-md ">
          <h2 className="text-2xl font-bold text-text-primary ">
            {formatMessage({ id: 'retry_work', defaultMessage: 'Retry Work' })}
          </h2>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center dark:border-slate-700 pb-4 mb-4">
            <div className="text-sm text-text-muted mt-2 sm:mt-0 flex flex-col sm:flex-row sm:gap-4">
              <span>
                <strong>
                  {formatMessage({ id: 'type', defaultMessage: 'Type' })}
                </strong>{' '}
                {work.type}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              name="priority"
              id="priority"
              label={formatMessage({
                id: 'priority',
                defaultMessage: 'Priority',
              })}
              labelClassName="text-sm font-medium text-slate-500 mb-1"
              type="number"
              className="w-full py-2 text-sm text-text-primary dark:bg-slate-800 rounded-md"
            />

            <TextField
              name="retries"
              id="retries"
              label={formatMessage({
                id: 'retries',
                defaultMessage: 'Retries',
              })}
              labelClassName="text-sm font-medium text-slate-500 mb-1"
              type="number"
              className="w-full py-2 text-sm text-text-primary dark:bg-slate-800 rounded-md"
            />
          </div>

          <DatePickerField
            name="scheduled"
            label={formatMessage({
              id: 'scheduled',
              defaultMessage: 'Scheduled',
            })}
            labelClassName="text-sm font-medium text-slate-500 mb-1"
            className="w-full py-2 text-sm text-text-primary dark:bg-slate-800 rounded-md"
            containerClassName="w-full"
            locale={locale}
            showTimeInput
            timeFormat="p"
            timeIntervals={15}
          />

          <div>
            <JSONAreaField
              name="input"
              label={formatMessage({ id: 'input', defaultMessage: 'Input' })}
              labelClassName="text-sm font-medium text-slate-500 mb-1"
              className="w-full h-48 text-sm text-text-primary dark:bg-slate-800 rounded-md"
            />
          </div>
          <div className="border-t-slate-100 border-t border-t-border-subtle space-y-6 bg-surface-subtle p-5 text-right">
            <SubmitButton
              label={formatMessage({
                id: 'retry_submit',
                defaultMessage: 'Retry',
              })}
            />
          </div>
        </div>
      </Form>
    </FormWrapper>
  );
};

export default RetryForm;
