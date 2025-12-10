import type { Modules } from '../modules.ts';
import { supportedWarehousingProvidersService } from './supportedWarehousingProviders.ts';
import type { Product } from '@unchainedshop/core-products';
import { WarehousingDirector } from '../directors/WarehousingDirector.ts';
import type { WarehousingContext } from '../directors/WarehousingAdapter.ts';
import type { WarehousingProvider } from '@unchainedshop/core-warehousing';

export async function simulateProductInventoryService(
  this: Modules,
  {
    product,
    referenceDate,
  }: {
    product: Product;
    referenceDate?: Date;
  },
) {
  const deliveryProviders = await this.delivery.allProviders();

  return deliveryProviders.reduce<
    Promise<
      (WarehousingContext & { quantity?: number } & {
        warehousingProvider: WarehousingProvider;
      })[]
    >
  >(async (oldResult, deliveryProvider) => {
    const result = await oldResult;

    const warehousingProviders: WarehousingProvider[] = await supportedWarehousingProvidersService.bind(
      this,
    )({
      product,
      deliveryProvider,
    });

    const mappedWarehousingProviders = await Promise.all(
      warehousingProviders.map(async (warehousingProvider) => {
        const warehousingContext = {
          deliveryProvider,
          product,
          referenceDate,
        };

        const director = await WarehousingDirector.actions(warehousingProvider, warehousingContext, {
          modules: this,
        });
        const stock = await director.estimatedStock();

        return {
          warehousingProvider,
          ...warehousingContext,
          ...stock,
        };
      }),
    );

    return result.concat(result, mappedWarehousingProviders);
  }, Promise.resolve([]));
}
