import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';

import useAuth from '../../Auth/useAuth';
import Form from '../../forms/components/Form';
import FieldWithHelp from '../../forms/components/FieldWithHelp';
import SubmitButton from '../../forms/components/SubmitButton';
import TextField from '../../forms/components/TextField';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';

const ProductVariationOptionForm = ({
  onSubmit,
}: {
  onSubmit: OnSubmitType;
}) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();

  const successMessage = formatMessage({
    id: 'variation_option_added',
    defaultMessage: 'Variation option added successfully!',
  });

  const form = useForm({
    submit: onSubmit,
    successMessage,
    initialValues: {
      value: '',
      title: '',
    },
  });

  return (
    <Form
      form={form}
      className="variation-option-form relative overflow-visible"
    >
      <div className="mb-4 px-2 sm:px-4 pt-2">
        <div className="p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-800 dark:text-slate-200">
            {formatMessage({
              id: 'variation_options_explanation',
              defaultMessage:
                'Add individual choices for this variation (e.g., "Red", "Blue", "Green" for a Color variation)',
            })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 px-2 sm:px-4 sm:pb-4">
        <div className="col-span-1">
          <FieldWithHelp
            className="mt-2 pt-1"
            name="title"
            label={formatMessage({ id: 'title', defaultMessage: 'Title' })}
            helpText={formatMessage({
              id: 'variation_option_title_help',
              defaultMessage:
                'Display name customers see (e.g., "Red", "Large", "Cotton")',
            })}
            required
          />
        </div>
        <div className="col-span-1">
          <FieldWithHelp
            className="mt-2 pt-1"
            name="value"
            label={formatMessage({ id: 'value', defaultMessage: 'Value' })}
            helpText={formatMessage({
              id: 'variation_option_value_help',
              defaultMessage:
                'Internal identifier (e.g., "red", "large", "cotton")',
            })}
            required
          />
        </div>
      </div>

      {hasRole(IRoleAction.ManageProducts) && (
        <div className="text-right mt-2 px-6 pb-6">
          <SubmitButton
            className="py-2.5"
            label={formatMessage({
              id: 'add_variation_option',
              defaultMessage: 'Add option',
            })}
          />
        </div>
      )}
    </Form>
  );
};

export default ProductVariationOptionForm;
