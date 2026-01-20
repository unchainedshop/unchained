// Crypto preset: Cryptocurrency and token-related plugins

// Import plugin registry
import { pluginRegistry } from '@unchainedshop/core';

// Import payment plugins
import { CryptopayPlugin } from '../payment/cryptopay/index.ts';

// Import warehousing plugins
import { ETHMinterPlugin } from '../warehousing/eth-minter/index.ts';

// Import pricing plugins
import { ProductPriceRateConversionPlugin } from '../pricing/product-price-rateconversion/index.ts';

// Import worker plugins
import { ExportTokenPlugin } from '../worker/export-token/index.ts';
import { UpdateECBRatesPlugin } from '../worker/update-ecb-rates/index.ts';
import { UpdateCoinbaseRatesPlugin } from '../worker/update-coinbase-rates/index.ts';
import { UpdateTokenOwnershipPlugin } from '../worker/update-token-ownership/index.ts';

// Export empty default for backward compatibility
// Modules are now provided via plugin registry
export default {};

// Export registration function
export function registerCryptoPlugins() {
  // Payment
  pluginRegistry.register(CryptopayPlugin);

  // Warehousing
  pluginRegistry.register(ETHMinterPlugin);

  // Pricing
  pluginRegistry.register(ProductPriceRateConversionPlugin);

  // Workers
  pluginRegistry.register(ExportTokenPlugin);
  pluginRegistry.register(UpdateECBRatesPlugin);
  pluginRegistry.register(UpdateCoinbaseRatesPlugin);
  pluginRegistry.register(UpdateTokenOwnershipPlugin);
}
