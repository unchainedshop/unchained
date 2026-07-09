import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import useAuth from '../../Auth/useAuth';
import Toggle from '@/components/ui/Toggle';
import Form from '../../forms/components/Form';
import FormErrors from '@/components/ui/form/FormErrors';
import SubmitButton from '@/components/ui/form/SubmitButton';
import TagInputField from '@/components/ui/form/TagInputField';
import TextField from '@/components/ui/form/TextField';
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
          active={form.api.values.isRoot}
          onToggle={() =>
            form.api.setFieldValue('isRoot', !form.api.values.isRoot)
          }
        />
        <span className="block text-sm text-text-muted mt-2">
          {formatMessage({
            id: 'root_description',
            defaultMessage: 'This makes the assortment a top level category',
          })}
        </span>
      </div>
      <FormErrors />
      {hasRole(IRoleAction.ManageAssortments) && (
        <div className="border-t-slate-100 border-t border-t-border-subtle space-y-6 bg-surface-subtle p-5 text-right">
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
