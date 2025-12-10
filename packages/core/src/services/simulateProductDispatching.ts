import type { Modules } from '../modules.ts';
import { supportedWarehousingProvidersService } from './supportedWarehousingProviders.ts';
import type { Product } from '@unchainedshop/core-products';
import { type EstimatedDispatch, WarehousingDirector } from '../directors/WarehousingDirector.ts';
import type { WarehousingContext } from '../directors/WarehousingAdapter.ts';
import type { WarehousingProvider } from '@unchainedshop/core-warehousing';

export async function simulateProductDispatchingService(
  this: Modules,
  {
    product,
    quantity,
    referenceDate,
  }: {
    product: Product;
    quantity: number;
    referenceDate?: Date;
  },
) {
  const deliveryProviders = await this.delivery.allProviders();

  return deliveryProviders.reduce<
    Promise<(WarehousingContext & EstimatedDispatch & { warehousingProvider: WarehousingProvider })[]>
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
        const warehousingContext: WarehousingContext = {
          deliveryProvider,
          product,
          quantity,
          referenceDate,
        };

        const director = await WarehousingDirector.actions(warehousingProvider, warehousingContext, {
          modules: this,
        });
        const dispatch = await director.estimatedDispatch();

        return {
          warehousingProvider,
          ...warehousingContext,
          ...dispatch,
        };
      }),
    );

    return result.concat(result, mappedWarehousingProviders);
  }, Promise.resolve([]));
}
