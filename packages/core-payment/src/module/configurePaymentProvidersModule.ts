import { Context } from '@unchainedshop/types/api';
import { Collection } from '@unchainedshop/types/common';
import { ModuleMutations } from '@unchainedshop/types/core';
import {
  PaymentContext,
  PaymentModule,
  PaymentProvider,
  PaymentProviderQuery,
} from '@unchainedshop/types/payments';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { PaymentPricingDirector } from '../director/PaymentPricingDirector';
import { PaymentPricingSheet } from '../director/PaymentPricingSheet';
import { PaymentProvidersSchema } from '../db/PaymentProvidersSchema';
import { PaymentDirector } from '../director/PaymentDirector';
import { paymentSettings } from '../payment-settings';

const PAYMENT_PROVIDER_EVENTS: string[] = [
  'PAYMENT_PROVIDER_CREATE',
  'PAYMENT_PROVIDER_UPDATE',
  'PAYMENT_PROVIDER_REMOVE',
];

const buildFindSelector = ({ type }: PaymentProviderQuery = {}) => {
  return { ...(type ? { type } : {}), deleted: null };
};

const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_v, index) => results[index]);
};

export const configurePaymentProvidersModule = (
  PaymentProviders: Collection<PaymentProvider>,
): PaymentModule['paymentProviders'] => {
  registerEvents(PAYMENT_PROVIDER_EVENTS);

  const mutations = generateDbMutations<PaymentProvider>(
    PaymentProviders,
    PaymentProvidersSchema,
  ) as ModuleMutations<PaymentProvider>;

  const getPaymentAdapter = async (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    requestContext: Context,
  ) => {
    const provider = await PaymentProviders.findOne(generateDbFilterById(paymentProviderId), {});

    return PaymentDirector.actions(provider, paymentContext, requestContext);
  };

  return {
    // Queries
    count: async (query) => {
      const providerCount = await PaymentProviders.countDocuments(buildFindSelector(query));
      return providerCount;
    },

    findProvider: async ({ paymentProviderId, ...query }, options) => {
      return PaymentProviders.findOne(
        paymentProviderId ? generateDbFilterById(paymentProviderId) : query,
        options,
      );
    },

    findProviders: async (query, options) => {
      const providers = PaymentProviders.find(buildFindSelector(query), options);
      return providers.toArray();
    },

    providerExists: async ({ paymentProviderId }) => {
      const providerCount = await PaymentProviders.countDocuments(
        generateDbFilterById(paymentProviderId, { deleted: null }),
        { limit: 1 },
      );
      return !!providerCount;
    },

    findInterface: (paymentProvider) => {
      const Adapter = PaymentDirector.getAdapter(paymentProvider.adapterKey);
      if (!Adapter) return null;
      return {
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      };
    },

    pricingSheet: (params) => {
      return PaymentPricingSheet(params);
    },

    findInterfaces: ({ type }) => {
      return PaymentDirector.getAdapters()
        .filter((Adapter) => Adapter.typeSupported(type))
        .map((Adapter) => ({
          _id: Adapter.key,
          label: Adapter.label,
          version: Adapter.version,
        }));
    },

    findSupported: async (paymentContext, requestContext) => {
      const allProviders = await PaymentProviders.find({ deleted: null }).toArray();
      const providers: PaymentProvider[] = await asyncFilter(
        allProviders,
        async (provider: PaymentProvider) => {
          try {
            const director = await PaymentDirector.actions(provider, paymentContext, requestContext);
            return director.isActive();
          } catch {
            return false;
          }
        },
      );

      return paymentSettings.filterSupportedProviders(
        {
          providers,
          order: paymentContext.order,
        },
        requestContext,
      );
    },

    determineDefault: async (paymentProviders, deliveryContext, requestContext) => {
      return paymentSettings.determineDefaultProvider(
        {
          providers: paymentProviders,
          ...deliveryContext,
        },
        requestContext,
      );
    },

    // Payment Adapter

    configurationError: async (paymentProvider, requestContext) => {
      const actions = await PaymentDirector.actions(paymentProvider, {}, requestContext);
      return actions.configurationError();
    },

    calculate: async (pricingContext, requestContext) => {
      const pricing = await PaymentPricingDirector.actions(pricingContext, requestContext);
      return pricing.calculate();
    },

    isActive: async (paymentProvider, requestContext) => {
      const actions = await PaymentDirector.actions(paymentProvider, {}, requestContext);
      return actions.isActive();
    },

    isPayLaterAllowed: async (paymentProvider, requestContext) => {
      const actions = await PaymentDirector.actions(paymentProvider, {}, requestContext);
      return actions.isPayLaterAllowed();
    },

    charge: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, requestContext);
      return adapter.charge();
    },

    register: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, requestContext);
      return adapter.register();
    },

    sign: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, requestContext);
      return adapter.sign();
    },

    validate: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, requestContext);
      return adapter.validate();
    },

    cancel: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, requestContext);
      return adapter.cancel();
    },

    confirm: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, requestContext);
      return adapter.confirm();
    },

    // Mutations
    create: async (doc, userId) => {
      const Adapter = PaymentDirector.getAdapter(doc.adapterKey);
      if (!Adapter) return null;

      const paymentProviderId = await mutations.create(
        {
          configuration: Adapter.initialConfiguration,
          ...doc,
        },
        userId,
      );

      const paymentProvider = await PaymentProviders.findOne(
        generateDbFilterById(paymentProviderId),
        {},
      );
      await emit('PAYMENT_PROVIDER_CREATE', { paymentProvider });
      return paymentProvider;
    },

    update: async (_id: string, doc: PaymentProvider, userId: string) => {
      await mutations.update(_id, doc, userId);
      const paymentProvider = await PaymentProviders.findOne(generateDbFilterById(_id), {});
      await emit('PAYMENT_PROVIDER_UPDATE', { paymentProvider });
      return paymentProvider;
    },

    delete: async (_id, userId) => {
      await mutations.delete(_id, userId);
      const paymentProvider = await PaymentProviders.findOne(generateDbFilterById(_id), {});
      await emit('PAYMENT_PROVIDER_REMOVE', { paymentProvider });
      return paymentProvider;
    },

    deletePermanently: async (_id, userId) => {
      const deliveryProvider = await PaymentProviders.findOne(generateDbFilterById(_id), {});
      await mutations.deletePermanently(_id, userId);
      return deliveryProvider;
    },
  };
};
