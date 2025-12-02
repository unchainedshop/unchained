import { useIntl } from 'react-intl';

import Button from '../../common/components/Button';
import Form from '../../forms/components/Form';
import TextField from '../../forms/components/TextField';
import TextAreaField from '../../forms/components/TextAreaField';
import SubmitButton from '../../forms/components/SubmitButton';
import { Validator } from '../../forms/lib/validators';
import useForm from '../../forms/hooks/useForm';

interface TagFormData {
  name: string;
  description?: string;
  category?: string;
}

interface TagFormProps {
  initialValues?: Partial<TagFormData>;
  onSubmit: (data: TagFormData) => Promise<void>;
  submitButtonText?: string;
  isLoading?: boolean;
}

const TagForm = ({
  initialValues = {},
  onSubmit,
  submitButtonText = 'Save',
  isLoading = false,
}: TagFormProps) => {
  const { formatMessage } = useIntl();

  // Custom validator for tag name format
  const validateTagName: Validator = {
    isValid: (value) => {
      if (!value || typeof value !== 'string') return false;
      if (value.length < 2 || value.length > 50) return false;
      return /^[a-z0-9\-_]+$/.test(value);
    },
    intlMessageDescriptor: {
      id: 'tag_name_format',
      defaultMessage:
        'Tag name must be 2-50 characters and contain only lowercase letters, numbers, hyphens, and underscores',
    },
  };

  const form = useForm({
    initialValues: {
      name: initialValues.name || '',
      description: initialValues.description || '',
      category: initialValues.category || '',
    },
    submit: async (values: TagFormData) => {
      await onSubmit(values);
      return { success: true };
    },
    successMessage: formatMessage({
      id: 'tag_saved_successfully',
      defaultMessage: 'Tag saved successfully',
    }),
  });

  return (
    <Form form={form} className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">
          {formatMessage({
            id: 'tag_information',
            defaultMessage: 'Tag Information',
          })}
        </h3>

        <div className="space-y-4">
          <TextField
            name="name"
            label={formatMessage({
              id: 'tag_name',
              defaultMessage: 'Tag Name',
            })}
            placeholder={formatMessage({
              id: 'tag_name_placeholder',
              defaultMessage: 'e.g., electronics, outdoor-gear, premium',
            })}
            help={formatMessage({
              id: 'tag_name_help',
              defaultMessage:
                'Use lowercase letters, numbers, hyphens, and underscores only. This will be used in URLs and filters.',
            })}
            required
            maxLength={50}
            validators={[validateTagName]}
          />

          <TextAreaField
            name="description"
            label={formatMessage({
              id: 'tag_description',
              defaultMessage: 'Description',
            })}
            placeholder={formatMessage({
              id: 'tag_description_placeholder',
              defaultMessage:
                'Describe when and how this tag should be used...',
            })}
            help={formatMessage({
              id: 'tag_description_help',
              defaultMessage:
                'Optional description to help team members understand when to use this tag.',
            })}
            maxLength={200}
            rows={3}
          />

          <TextField
            name="category"
            label={formatMessage({
              id: 'tag_category',
              defaultMessage: 'Category',
            })}
            placeholder={formatMessage({
              id: 'tag_category_placeholder',
              defaultMessage: 'e.g., product-type, theme, campaign',
            })}
            help={formatMessage({
              id: 'tag_category_help',
              defaultMessage:
                'Optional category to group related tags together (e.g., "product-type", "theme", "campaign").',
            })}
            maxLength={50}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          {formatMessage({
            id: 'cancel',
            defaultMessage: 'Cancel',
          })}
        </Button>
        <SubmitButton label={submitButtonText} />
      </div>
    </Form>
  );
};

export default TagForm;