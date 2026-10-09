import type { Context } from '../../context.ts';

const normalizeProxyAssignments = async (assignment, context: Context) => {
  const { loaders, modules, locale } = context;
  const assignedProduct = await loaders.productLoader.load({
    productId: assignment.productId,
  });
  const productMedias = await modules.products.media.findProductMedias({
    productId: assignment.productId,
  });
  const media = await context.services.files.resolveMediaFiles(productMedias);
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
