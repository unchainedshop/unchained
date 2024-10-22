import { ModuleInput } from '@unchainedshop/mongodb';
import { configureCryptopayModule } from '../payment/cryptopay/index.js';

// Warehousing
import '../warehousing/eth-minter.js';

import '../pricing/product-price-rateconversion.js';
import '../worker/update-ecb-rates.js';
import '../worker/update-coinbase-rates.js';
import '../worker/export-token.js';

const modules: Record<
  string,
  {
    configure: (params: ModuleInput<any>) => any;
  }
> = {
  cryptopay: {
    configure: configureCryptopayModule,
  },
};

export default modules;
