import { useIntl } from 'react-intl';
import { PlusIcon } from '@heroicons/react/24/outline';
import Loading from '../../common/components/Loading';
import NoData from '../../common/components/NoData';
import Button from '../../common/components/Button';
import { OnSubmitType } from '../../forms/hooks/useForm';
import useCreateProductVariation from '../hooks/useCreateProductVariation';
import useProductVariations from '../hooks/useProductVariations';
import useProductVariationTypes from '../hooks/useProductVariationTypes';
import useAuth from '../../Auth/useAuth';
import useModal from '../../modal/hooks/useModal';
import useForm from '../../forms/hooks/useForm';
import Form from '../../forms/components/Form';
import FieldWithHelp from '../../forms/components/FieldWithHelp';
import SelectField from '../../forms/components/SelectField';
import SubmitButton from '../../forms/components/SubmitButton';
import HelpText from '../../common/components/HelpText';
import convertArrayOfObjectToObject from '../../common/convertArrayOfObjectToObject';

import ProductVariationsList from './ProductVariationsList';
import useApp from '../../common/hooks/useApp';

const ProductVariationModalForm = ({ onSubmit, disabled, formatMessage }) => {
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
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {formatMessage({
            id: 'product_variations_explanation_title',
            defaultMessage: 'About Product Variations',
          })}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {formatMessage({
            id: 'product_variations_explanation',
            defaultMessage:
              'Variations allow customers to choose different options for your product (like color, size, material). Each variation can have multiple options that customers can select from.',
          })}
        </p>
      </div>

      <Form form={form}>
        <div className="space-y-6">
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
            className="w-full"
          />

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
            className="w-full"
          />

          <div>
            <SelectField
              required
              className="w-full"
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

        <div className="flex justify-end mt-6 py-6 -mb-6 bg-slate-100 -mx-6 pe-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <SubmitButton
            hidden={!hasRole('addProductVariation')}
            label={formatMessage({
              id: 'add_variation',
              defaultMessage: 'Add variation',
            })}
          />
        </div>
      </Form>
    </div>
  );
};

const ProductVariation = ({
  productId,

  disabled = false,
}) => {
  const { createProductVariation } = useCreateProductVariation();
  const { selectedLocale } = useApp();
  const { formatMessage } = useIntl();
  const { setModal } = useModal();

  const { variations, loading } = useProductVariations({
    productId,
    locale: selectedLocale,
  });

  const onSubmit: OnSubmitType = async ({ title, key, type }) => {
    await createProductVariation({
      productId,
      variation: { key, type },
      texts: [{ title, locale: selectedLocale }],
    });
    setModal(''); // Close modal after successful submission
    return { success: true };
  };

  const openAddVariationModal = () => {
    setModal(
      <ProductVariationModalForm
        onSubmit={onSubmit}
        disabled={disabled}
        formatMessage={formatMessage}
      />,
    );
  };
  if (loading) return <Loading />;

  return (
    <div className="mt-6 overflow-hidden rounded-md w-full max-w-full">
      <div className="mb-6 flex justify-end items-center">
        <Button
          className="m-1"
          onClick={openAddVariationModal}
          disabled={disabled}
          variant="secondary"
          icon={<PlusIcon className="w-5 h-5" />}
          text={formatMessage({
            id: 'add_variation',
            defaultMessage: 'Add variation',
          })}
        />
      </div>

      <div className="flex flex-col border border-slate-200 dark:border-slate-700 rounded-md overflow-x-hidden overflow-y-visible w-full relative">
        {!variations?.length ? (
          <NoData
            message={formatMessage({
              id: 'variations',
              defaultMessage: 'Variations',
            })}
          />
        ) : (
          variations?.map((variation) => (
            <ProductVariationsList
              productVariationId={variation._id}
              key={variation._id}
              variation={variation}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ProductVariation;
