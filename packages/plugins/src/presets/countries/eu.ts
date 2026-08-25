import { ProductEuTaxPlugin } from '../../pricing/product-eu-tax/index.ts';
import { DeliveryEuTaxPlugin } from '../../pricing/delivery-eu-tax/index.ts';
import { pluginRegistry } from '@unchainedshop/core';

export function registerEuTaxPlugins() {
  pluginRegistry.register(ProductEuTaxPlugin);
  pluginRegistry.register(DeliveryEuTaxPlugin);
}
