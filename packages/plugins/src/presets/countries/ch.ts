import { ProductSwissTaxPlugin } from '../../pricing/product-swiss-tax/index.ts';
import { DeliverySwissTaxPlugin } from '../../pricing/delivery-swiss-tax/index.ts';
import { pluginRegistry } from '@unchainedshop/core';

export function registerSwissTaxPlugins() {
  pluginRegistry.register(ProductSwissTaxPlugin);
  pluginRegistry.register(DeliverySwissTaxPlugin);
}
