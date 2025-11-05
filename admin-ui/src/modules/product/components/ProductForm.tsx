import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';

import Form from '../../forms/components/Form';
import SelectField from '../../forms/components/SelectField';
import SubmitButton from '../../forms/components/SubmitButton';
import TagInputField from '../../forms/components/TagInputField';
import TextField from '../../forms/components/TextField';
import useForm, {
  OnSubmitSuccessType,
  OnSubmitType,
} from '../../forms/hooks/useForm';
import HelpText from '../../common/components/HelpText';
import { PRODUCT_TYPES } from '../ProductTypes';
import useApp from '../../common/hooks/useApp';

const ProductForm = ({
  onSubmit,
  onSubmitSuccess,
}: {
  onSubmit: OnSubmitType;
  onSubmitSuccess: OnSubmitSuccessType;
}) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { selectedLocale, shopInfo } = useApp();

  const successMessage = formatMessage({
    id: 'product_added',
    defaultMessage: 'Product added successfully!',
  });
  const form = useForm({
    submit: async (values) => {
      const { title, subtitle, type, tags } = values;

      if (!title || !type) {
        return { success: false };
      }

      const texts = [
        {
          title,
          subtitle: subtitle || '',
          slug: title.toLowerCase().replace(/\s+/g, '-'),
          locale: selectedLocale,
        },
      ];

      return await onSubmit({ texts, type, tags: tags || [] });
    },
    onSubmitSuccess,
    successMessage,
    initialValues: {
      title: '',
      subtitle: '',
      type: 'SimpleProduct',
      tags: [],
    },
  });

  return (
    <Form form={form}>
      <div className="p-5 pb-7 sm:max-w-full flex flex-col gap-3">
        <TextField
          name="title"
          id="title"
          label={formatMessage({
            id: 'name',
            defaultMessage: 'Name',
          })}
          required
          className="block w-full max-w-full rounded-md border-slate-300 dark:border-slate-800 text-sm focus:ring-slate-800 sm:text-sm"
        />

        <TextField
          name="subtitle"
          id="subtitle"
          label={formatMessage({
            id: 'subtitle',
            defaultMessage: 'Subtitle',
          })}
          className="block w-full max-w-full rounded-md border-slate-300 dark:border-slate-800 text-sm focus:ring-slate-800 sm:text-sm"
        />

        <SelectField
          className="mt-1 w-full"
          label={formatMessage({ id: 'type', defaultMessage: 'Type' })}
          placeholder={formatMessage({ id: 'type', defaultMessage: 'Type' })}
          required
          name="type"
          options={PRODUCT_TYPES}
        />

        <TagInputField
          name="tags"
          label={formatMessage({ id: 'tags', defaultMessage: 'Tags' })}
          placeholder={formatMessage({
            id: 'enter_tag',
            defaultMessage: 'Enter tag...',
          })}
          selectOptions={(shopInfo?.adminUiConfig.productTags || []).map(
            (tag) => ({ value: tag, label: tag }),
          )}
        />
        <HelpText
          messageKey="product_tags_help"
          defaultMessage="Add keywords to organize and filter products (e.g., 'electronics', 'outdoor', 'premium'). These work across all languages and help customers find products through search and filters."
          className="mt-1"
        />
      </div>

      {hasRole('manageProducts') && (
        <div className="border-t border-t-slate-100 dark:border-t-slate-700 bg-slate-50 dark:bg-slate-900 p-5 text-right">
          <SubmitButton
            label={formatMessage({
              id: 'add_product',
              defaultMessage: 'Add Product',
            })}
          />
        </div>
      )}
    </Form>
  );
};

export default ProductForm;
