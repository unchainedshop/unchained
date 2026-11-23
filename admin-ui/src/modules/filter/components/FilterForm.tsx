import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import convertArrayOfObjectToObject from '../../common/convertArrayOfObjectToObject';
import Form from '../../forms/components/Form';
import FormErrors from '@/components/ui/form/FormErrors';

import SelectField from '@/components/ui/form/SelectField';
import SubmitButton from '@/components/ui/form/SubmitButton';
import TextField from '@/components/ui/form/TextField';
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
    },
    getSubmitErrorMessage: (error) => {
      if (error?.extensions?.code === 'DuplicateFilterKeyError') {
        form.api.setFieldError(
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
      </div>
      <FormErrors />
      {hasRole(IRoleAction.ManageFilters) && (
        <div className="space-y-6 bg-surface-subtle border-t-border-subtle p-5 text-right">
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
