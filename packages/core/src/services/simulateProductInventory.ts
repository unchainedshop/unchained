import { DeliveryProvider } from '@unchainedshop/core-delivery';
import { Modules } from '../modules.js';
import { supportedWarehousingProvidersService } from './supportedWarehousingProviders.js';
import { Product } from '@unchainedshop/core-products';
import { EstimatedStock, WarehousingDirector } from '../directors/WarehousingDirector.js';
import { WarehousingContext } from '../directors/WarehousingAdapter.js';
import { WarehousingProvider } from '@unchainedshop/core-warehousing';

export async function simulateProductInventoryService(
  this: Modules,
  {
    deliveryProviders,
    product,
    referenceDate,
  }: {
    product: Product;
    deliveryProviders: DeliveryProvider[];
    referenceDate?: Date;
  },
) {
  return deliveryProviders.reduce<
    Promise<Array<WarehousingContext & EstimatedStock & { warehousingProvider: WarehousingProvider }>>
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
