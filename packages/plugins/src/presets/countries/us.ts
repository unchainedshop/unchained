import { ProductUsSalesTaxPlugin } from '../../pricing/product-us-sales-tax/index.ts';
import { DeliveryUsSalesTaxPlugin } from '../../pricing/delivery-us-sales-tax/index.ts';
import { pluginRegistry } from '@unchainedshop/core';

export function registerUsSalesTaxPlugins() {
  pluginRegistry.register(ProductUsSalesTaxPlugin);
  pluginRegistry.register(DeliveryUsSalesTaxPlugin);
}
