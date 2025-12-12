import { useIntl } from 'react-intl';
import useApp from '../../common/hooks/useApp';
import useAddProductAssignment from './useAddProductAssignment';
import useCreateProduct from './useCreateProduct';
import { IProductType } from '../../../gql/types';

function useScaffoldVariationProduct({ proxyProduct, vectors, onSuccess }) {
  const { selectedLocale } = useApp();
  const { createProduct } = useCreateProduct();
  const { addProductAssignment } = useAddProductAssignment();
  const { formatMessage } = useIntl();

  return async ({ title, type }) => {
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
    await addProductAssignment({
      productId: scaffoldedProductID,
      proxyId: proxyProduct?._id,
      vectors,
    });

    onSuccess?.(scaffoldedProduct);
    return { success: true };
  };
}

export default useScaffoldVariationProduct;
