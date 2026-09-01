import { ProductUkTaxPlugin } from '../../pricing/product-uk-tax/index.ts';
import { DeliveryUkTaxPlugin } from '../../pricing/delivery-uk-tax/index.ts';
import { pluginRegistry } from '@unchainedshop/core';

export function registerUkTaxPlugins() {
  pluginRegistry.register(ProductUkTaxPlugin);
  pluginRegistry.register(DeliveryUkTaxPlugin);
}
