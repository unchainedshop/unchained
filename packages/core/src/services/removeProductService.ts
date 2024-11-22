import { AssortmentsModule } from '@unchainedshop/core-assortments';
import { BookmarksModule } from '@unchainedshop/core-bookmarks';
import { OrdersModule } from '@unchainedshop/core-orders';
import { ProductsModule, ProductStatus } from '@unchainedshop/core-products';

export type RemoveProductService = (
  params: { productId: string },
  unchainedAPI: {
    modules: {
      products: ProductsModule;
      bookmarks: BookmarksModule;
      assortments: AssortmentsModule;
      orders: OrdersModule;
    };
  },
) => Promise<boolean>;

export const removeProductService: RemoveProductService = async ({ productId }, unchainedAPI) => {
  const { modules } = unchainedAPI;
  const product = await modules.products.findProduct({ productId });
  switch (product.status) {
    case ProductStatus.ACTIVE:
      await modules.products.unpublish(product);
    // falls through
    case null:
    case ProductStatus.DRAFT:
      {
        await modules.bookmarks.deleteByProductId(productId);
        await modules.assortments.products.delete(productId);
        const orderIdsToRecalculate =
          await modules.orders.positions.removeProductByIdFromAllOpenPositions(productId);
        await Promise.all(
          [...new Set(orderIdsToRecalculate)].map(async (orderIdToRecalculate) => {
            await modules.orders.updateCalculation(orderIdToRecalculate, unchainedAPI as any);
          }),
        );
        await modules.products.delete(productId);
      }
      break;
    default:
      throw new Error(`Invalid status', ${product.status}`);
  }

  return true;
};
