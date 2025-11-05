import { useIntl } from 'react-intl';

import useAuth from '../../Auth/useAuth';
import FormWrapper from '../../common/components/FormWrapper';
import convertArrayOfObjectToObject from '../../common/convertArrayOfObjectToObject';

import Form from '../../forms/components/Form';
import FieldWithHelp from '../../forms/components/FieldWithHelp';
import SelectField from '../../forms/components/SelectField';
import SubmitButton from '../../forms/components/SubmitButton';
import HelpText from '../../common/components/HelpText';
import useForm, { OnSubmitType } from '../../forms/hooks/useForm';
import useProductVariationTypes from '../hooks/useProductVariationTypes';

const ProductVariationForm = ({
  onSubmit,
  disabled = false,
}: {
  onSubmit: OnSubmitType;
  disabled?: boolean;
}) => {
  const { formatMessage } = useIntl();

  const { variationTypes } = useProductVariationTypes();
  const { hasRole } = useAuth();
  const successMessage = formatMessage({
    id: 'product_variation_added',
    defaultMessage: 'Product variation added successfully',
  });

  const form = useForm({
    disabled,
    submit: onSubmit,
    successMessage,
    initialValues: {
      title: '',
      key: '',
      type: '',
    },
  });

  return (
    <FormWrapper>
      <Form form={form}>
        <div className="max-w-full rounded-md p-2 sm:p-4">
          <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-900/20 rounded-lg border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              {formatMessage({
                id: 'product_variations_explanation_title',
                defaultMessage: 'About Product Variations',
              })}
            </h3>
            <p className="text-sm text-slate-800 dark:text-blue-200">
              {formatMessage({
                id: 'product_variations_explanation',
                defaultMessage:
                  'Variations allow customers to choose different options for your product (like color, size, material). Each variation can have multiple options that customers can select from.',
              })}
            </p>
          </div>

          {/* Title Field */}
          <div className="mb-6">
            <FieldWithHelp
              name="title"
              id="title"
              label={formatMessage({
                id: 'title',
                defaultMessage: 'Title',
              })}
              helpText={formatMessage({
                id: 'product_variation_title_help',
                defaultMessage:
                  'The display name customers will see (e.g., "Color", "Size", "Material")',
              })}
              required
              autoComplete="on"
              className="w-full text-sm text-slate-400 dark:text-slate-200"
            />
          </div>
          <div className="grid grid-rows-2 gap-4">
            <div className="space-y-1">
              <FieldWithHelp
                name="key"
                id="key"
                label={formatMessage({
                  id: 'key',
                  defaultMessage: 'Key',
                })}
                helpText={formatMessage({
                  id: 'product_variation_key_help',
                  defaultMessage:
                    'Unique identifier used internally (e.g., "color", "size"). Use lowercase without spaces.',
                })}
                required
                autoComplete="on"
                className="w-full text-sm text-slate-400 dark:text-slate-200"
              />
            </div>
            <div className="space-y-1">
              <SelectField
                required
                className="mt-0 w-full pb-2 text-sm text-slate-400 dark:text-slate-200"
                label={formatMessage({
                  id: 'type',
                  defaultMessage: 'Type',
                })}
                placeholder={formatMessage({
                  id: 'type',
                  defaultMessage: 'Type',
                })}
                name="type"
                options={convertArrayOfObjectToObject(
                  variationTypes,
                  'value',
                  'value',
                )}
              />
              <HelpText
                messageKey="product_variation_type_help"
                defaultMessage="COLOR: For predefined options like colors or sizes. TEXT: For free-form input like custom text or measurements."
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {hasRole('manageProducts') && (
          <div className="space-y-6 bg-slate-50 dark:bg-slate-700 px-5 py-6 text-right">
            <SubmitButton
              label={formatMessage({
                id: 'add_variation',
                defaultMessage: 'Add variation',
              })}
            />
          </div>
        )}
      </Form>
    </FormWrapper>
  );
};

export default ProductVariationForm;
