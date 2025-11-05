import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import Toggle from '../../common/components/Toggle';
import Form from '../../forms/components/Form';
import FormErrors from '../../forms/components/FormErrors';
import SubmitButton from '../../forms/components/SubmitButton';
import TagInputField from '../../forms/components/TagInputField';
import TextField from '../../forms/components/TextField';
import useForm from '../../forms/hooks/useForm';
import useApp from '../../common/hooks/useApp';

const AssortmentForm = ({ onSubmit, onSubmitSuccess }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { selectedLocale, shopInfo } = useApp();
  const successMessage = formatMessage({
    id: 'assortment_added',
    defaultMessage: 'Assortment added successfully!',
  });
  const form = useForm({
    submit: async (data) => onSubmit({ ...data, locale: selectedLocale }),
    onSubmitSuccess,
    successMessage,
    enableReinitialize: true,
    initialValues: {
      isRoot: true,
      title: '',
      subtitle: '',
      tags: [],
    },
  });

  return (
    <Form form={form}>
      <div className="py-5 px-5">
        <TextField
          name="title"
          id="title"
          label={formatMessage({
            id: 'title',
            defaultMessage: 'Title',
          })}
          autoComplete="off"
          required
          className="mb-5"
        />
        <TextField
          name="subtitle"
          id="subtitle"
          label={formatMessage({
            id: 'subtitle',
            defaultMessage: 'Subtitle',
          })}
          autoComplete="off"
          className="mb-5"
        />

        <TagInputField
          name="tags"
          id="tags"
          label={formatMessage({ id: 'tags', defaultMessage: 'Tags' })}
          selectOptions={(shopInfo?.adminUiConfig?.assortmentTags || []).map(
            (tag) => ({ value: tag, label: tag }),
          )}
        />
      </div>
      <div className="mx-5 mb-5">
        <Toggle
          toggleText={formatMessage({
            id: 'root_node',
            defaultMessage: 'Root node',
          })}
          active={form.formik.values.isRoot}
          onToggle={() =>
            form.formik.setFieldValue('isRoot', !form.formik.values.isRoot)
          }
        />
        <span className="block text-sm text-slate-400 dark:text-slate-500 mt-2">
          {formatMessage({
            id: 'root_description',
            defaultMessage: 'This makes the assortment a top level category',
          })}
        </span>
      </div>
      <FormErrors />
      {hasRole('manageAssortments') && (
        <div className="border-t-slate-100 border-t dark:border-t-slate-700 space-y-6 bg-slate-50 dark:bg-slate-900 p-5 text-right">
          <SubmitButton
            label={formatMessage({
              id: 'add_assortment',
              defaultMessage: 'Add Assortment',
            })}
          />
        </div>
      )}
    </Form>
  );
};

export default AssortmentForm;
