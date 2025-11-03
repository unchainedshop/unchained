import { UnchainedCore } from '@unchainedshop/core';
import { PaymentProvider } from '@unchainedshop/core-payment';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ paymentProviderId: string }, PaymentProvider>(async (queries) => {
    const paymentProviderIds = [...new Set(queries.map((q) => q.paymentProviderId).filter(Boolean))];

    const paymentProviders = await unchainedAPI.modules.payment.paymentProviders.findProviders({
      _id: { $in: paymentProviderIds },
      includeDeleted: true,
    });

    const paymentProviderMap = {};
    for (const paymentProvider of paymentProviders) {
      paymentProviderMap[paymentProvider._id] = paymentProvider;
    }

    return queries.map((q) => paymentProviderMap[q.paymentProviderId]);
  });
