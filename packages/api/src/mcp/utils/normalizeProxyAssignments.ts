import type { Context } from '../../context.ts';
import normalizeMediaUrl from './normalizeMediaUrl.ts';

const normalizeProxyAssignments = async (assignment, context: Context) => {
  const { loaders, modules, locale } = context;
  const assignedProduct = await loaders.productLoader.load({
    productId: assignment.productId,
  });
  const productMedias = await modules.products.media.findProductMedias({
    productId: assignment.productId,
  });
  const media = await normalizeMediaUrl(productMedias, context);
  const texts = await loaders.productTextLoader.load({
    productId: assignment.productId,
    locale,
  });
  return {
    assignment: {
      ...(assignment || {}),
      product: {
        ...assignedProduct,
        media,
        texts,
      },
    },
  };
};

export default normalizeProxyAssignments;
