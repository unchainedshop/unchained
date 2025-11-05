import { FieldArray } from 'formik';
import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import DeleteButton from '../../common/components/DeleteButton';
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
import useFilterTypes from '../hooks/useFilterTypes';
import useApp from '../../common/hooks/useApp';

const FilterForm = ({
  onSubmit,
  onSubmitSuccess,
}: {
  onSubmit: OnSubmitType;
  onSubmitSuccess: OnSubmitSuccessType;
}) => {
  const { filterTypes } = useFilterTypes();
  const { formatMessage } = useIntl();
  const { selectedLocale } = useApp();
  const { hasRole } = useAuth();
  const successMessage = formatMessage({
    id: 'filter_created',
    defaultMessage: 'Filter created successfully!',
  });
  const form = useForm({
    submit: (val) => onSubmit({ ...val, locale: selectedLocale }),
    onSubmitSuccess,
    successMessage,
    enableReinitialize: true,
    initialValues: {
      title: '',
      type: '',
      key: '',
      options: [''],
    },
    getSubmitErrorMessage: (error) => {
      if (error?.extensions?.code === 'DuplicateFilterKeyError') {
        form.formik.setFieldError(
          'key',
          formatMessage({
            id: 'filter_key_already_exists',
            defaultMessage:
              'Filter key already exists, please provide unique key',
          }),
        );
        return formatMessage({
          id: 'filter_key_already_exists',
          defaultMessage:
            'Filter key already exists, please provide unique key',
        });
      }
      return (
        error?.message ||
        formatMessage({
          id: 'error-something-went-wrong',
          defaultMessage:
            'Unable to complete the task successfully please try again',
        })
      );
    },
  });

  const { values } = form.formik;

  return (
    <Form form={form}>
      <div className="p-5">
        <TextField
          name="title"
          id="title"
          label={formatMessage({
            id: 'title',
            defaultMessage: 'Title',
          })}
          required
          className="mb-5"
        />

        <TextField
          name="key"
          id="key"
          label={formatMessage({
            id: 'key',
            defaultMessage: 'Key',
          })}
          required
          className="mb-5"
        />

        <SelectField
          className="mb-5"
          label={formatMessage({ id: 'type', defaultMessage: 'Type' })}
          required
          name="type"
          options={convertArrayOfObjectToObject(filterTypes, 'label', 'value')}
        />

        <FieldArray name="options">
          {({ push, remove: removeConfig }) => (
            <div>
              {values.options.map((p, index) => {
                return (
                  <div
                    key={index}
                    className="mb-3 flex justify-between align-baseline"
                  >
                    <TextField
                      name={`options[${index}]`}
                      id={`options[${index}]`}
                      required
                      label={formatMessage({
                        id: 'option',
                        defaultMessage: 'Option',
                      })}
                    />
                    <div className="ml-2 shrink-0 mt-8">
                      <DeleteButton onClick={() => removeConfig(index)} />
                    </div>
                  </div>
                );
              })}
              <div className="mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap">
                <div className=" mt-2 shrink-0">
                  <div className="shrink-0">
                    <button
                      type="button"
                      className="items-right inline-flex rounded-sm border border-transparent bg-slate-800 px-2 py-2 text-sm font-medium text-white shadow-xs hover:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:ring-offset-2"
                      onClick={() => push('')}
                    >
                      <svg
                        className="h-5 w-5"
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
                      <span className="ml-2">
                        {formatMessage({
                          id: 'add_option',
                          defaultMessage: 'Add option',
                        })}{' '}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </FieldArray>
      </div>
      <FormErrors />
      {hasRole(IRoleAction.ManageFilters) && (
        <div className="space-y-6 bg-slate-50 dark:bg-slate-900 border-t-slate-100 dark:border-t-slate-700 p-5 text-right">
          <SubmitButton
            label={formatMessage({
              id: 'create_filter',
              defaultMessage: 'Create Filter',
            })}
          />
        </div>
      )}
    </Form>
  );
};

export default FilterForm;
