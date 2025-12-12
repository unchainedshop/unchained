import { useIntl } from 'react-intl';
import useApp from '../../common/hooks/useApp';
import useCreateProduct from './useCreateProduct';
import { IProductType } from '../../../gql/types';

function useScaffoldBundleItem({ onSuccess }) {
  const { selectedLocale } = useApp();
  const { createProduct } = useCreateProduct();
  const { formatMessage } = useIntl();
  return async ({ title, type, quantity = 1 }) => {
    const texts = [
      {
        title,
        slug: title.toLowerCase().replace(/\s+/g, '-'),
        locale: selectedLocale,
      },
    ];
    const { data } = await createProduct({
      product: { type: type || IProductType.SimpleProduct },
      texts,
    });

    const scaffoldedProduct = data?.createProduct;
    const scaffoldedProductID = scaffoldedProduct?._id;

    if (!scaffoldedProductID)
      throw new Error(
        formatMessage({
          id: 'product_creation_failed',
          defaultMessage: 'Product creation failed',
        }),
      );
    onSuccess?.(scaffoldedProduct, quantity);
    return { success: true };
  };
}

export default useScaffoldBundleItem;
