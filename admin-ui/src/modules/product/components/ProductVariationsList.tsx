import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import Accordion from '../../common/components/Accordion';
import DangerMessage from '../../modal/components/DangerMessage';
import useModal from '../../modal/hooks/useModal';
import useRemoveProductVariation from '../hooks/useRemoveProductVariation';

import Variation from './Variation';
import ProductVariationOptionsList from './ProductVariationOptionsList';

const ProductVariationsList = ({ productVariationId, variation }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { options } = variation;
  const { removeProductVariation } = useRemoveProductVariation();

  const onDeleteVariation = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_product_variation_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this variation? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeProductVariation({ productVariationId });
          toast.success(
            formatMessage({
              id: 'product_variation_deleted',
              defaultMessage: 'Variation deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_product_variation',
          defaultMessage: 'Delete variation',
        })}
      />,
    );
  };

  const variations = [
    {
      header: (
        <Variation
          onDelete={onDeleteVariation}
          variation={variation}
          {...variation}
        />
      ),
      body: (
        <ProductVariationOptionsList
          key={productVariationId}
          variationId={variation._id}
          options={options}
        />
      ),
    },
  ];

  return (
    <Accordion
      data-variationid={variation._id}
      data={variations}
      containerCSS="w-full max-w-full !my-0 !border-0 !shadow-none relative"
      bodyCSS="bg-slate-50 dark:bg-slate-950 !border-t-0 relative overflow-visible"
      itemContainerCSS="!mt-0 !mb-0 !border-0"
      headerCSS="w-full flex items-center justify-between !p-0 !bg-transparent !border-0"
      hideChevron={true}
    />
  );
};

export default ProductVariationsList;
