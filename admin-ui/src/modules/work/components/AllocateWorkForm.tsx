import { FieldArray } from 'formik';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import DeleteButton from '../../common/components/DeleteButton';
import FormWrapper from '../../common/components/FormWrapper';
import convertArrayOfObjectToObject from '../../common/convertArrayOfObjectToObject';
import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';
import SelectField from '../../forms/components/SelectField';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm, {
  OnSubmitSuccessType,
  OnSubmitType,
} from '../../forms/hooks/useForm';
import useAllocateWork from '../hooks/useAllocateWork';
import useRegisteredWorkTypes from '../hooks/useRegisteredWorkTypes';

const AllocateWorkForm = () => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const { allocateWork } = useAllocateWork();
  const { hasRole } = useAuth();

  const onSubmit: OnSubmitType = async ({ types, worker }) => {
    const { data, error } = await allocateWork({ types, worker });
    return { success: !!data?.allocateWork, data: data?.allocateWork, error };
  };

  const onSubmitSuccess: OnSubmitSuccessType = (_, { _id }) => {
    router.push(`/works?workerId=${_id}`);
    return null;
  };
  const successMessage = formatMessage({
    id: 'work_allocated_success',
    defaultMessage: 'Allocate work successfully!',
  });
  const form = useForm({
    submit: onSubmit,
    onSubmitSuccess,
    getSubmitErrorMessage: (error) => {
      return (
        error?.message ||
        formatMessage({
          id: 'error-something-went-wrong',
          defaultMessage:
            'Unable to complete the task successfully please try again',
        })
      );
    },
    successMessage,
    enableReinitialize: true,
    initialValues: {
      types: [''],
      worker: '',
    },
  });

  const { workTypes } = useRegisteredWorkTypes();

  const { values } = form.formik;
  return (
    <FormWrapper>
      <Form form={form}>
        <div className="p-6">
          <div className="mb-3">
            <TextField
              name="worker"
              id="worker"
              label={formatMessage({
                id: 'worker',
                defaultMessage: 'Worker',
              })}
              labelClassName="text-sm font-medium text-slate-500 mb-1"
              placeholder={formatMessage({
                id: 'worker',
                defaultMessage: 'Worker',
              })}
              className="max-w-full text-sm text-slate-900 sm:mt-0"
            />
          </div>
          <FieldArray name="types">
            {({ push, remove: removeConfig }) => (
              <div>
                {values.types.map((p, index) => {
                  return (
                    <div key={index} className="flex max-w-4xl items-center">
                      <div className="w-100 relative w-full pl-5 space-y-1 rounded-md sm:pr-2">
                        <div className="max-w-4xl justify-between align-baseline sm:flex">
                          <SelectField
                            className="w-full py-2 text-sm text-slate-500 dark:text-slate-200 sm:mt-0"
                            label={formatMessage({
                              id: 'type',
                              defaultMessage: 'Type',
                            })}
                            placeholder={formatMessage({
                              id: 'type',
                              defaultMessage: 'Type',
                            })}
                            labelClassName="text-sm font-medium text-slate-500 mb-1"
                            name={`types[${index}`}
                            required
                            options={convertArrayOfObjectToObject(
                              workTypes,
                              'label',
                              'value',
                            )}
                          />
                        </div>
                      </div>
                      <div className="ml-2 mt-5  shrink-0 sm:mt-4">
                        <DeleteButton onClick={() => removeConfig(index)} />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap">
                  <div className=" " />
                  <div className=" mt-2 shrink-0">
                    <div className="shrink-0">
                      <button
                        type="button"
                        className="items-right inline-flex rounded-full border border-transparent bg-slate-800 px-2 py-2 text-sm font-medium text-white shadow-xs bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:ring-offset-2"
                        onClick={() => push('')}
                      >
                        <svg
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </FieldArray>
        </div>
        <FormErrors />
        <div className="border-t-slate-100 border-t dark:border-slate-700 space-y-6 bg-slate-50 dark:bg-slate-800 px-5 py-6 text-right">
          <SubmitButton
            hidden={!hasRole('allocateWork')}
            label={formatMessage({
              id: 'allocate_work',
              defaultMessage: 'Allocate Work',
            })}
          />
        </div>
      </Form>
    </FormWrapper>
  );
};

export default AllocateWorkForm;
