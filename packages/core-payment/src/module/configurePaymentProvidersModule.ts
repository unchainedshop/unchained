import {
  ModuleMutations,
  ModuleMutationsWithReturnDoc,
  UnchainedCore,
} from '@unchainedshop/types/core.js';
import {
  PaymentChargeActionResult,
  PaymentContext,
  PaymentCredentials,
  PaymentError,
  PaymentInterface,
  PaymentProvider,
} from '../types.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbMutations, mongodb } from '@unchainedshop/mongodb';
import { PaymentPricingDirector } from '../director/PaymentPricingDirector.js';
import { PaymentPricingSheet } from '../director/PaymentPricingSheet.js';
import { PaymentProvidersSchema } from '../db/PaymentProvidersSchema.js';
import { PaymentDirector } from '../director/PaymentDirector.js';
import { paymentSettings } from '../payment-settings.js';
import { Order } from '@unchainedshop/types/orders.js';
import { PaymentProviderType } from '../payment-index.js';
import {
  IPaymentPricingSheet,
  PaymentPricingCalculation,
  PaymentPricingContext,
} from '@unchainedshop/types/payments.pricing.js';

export type PaymentProvidersModules = ModuleMutationsWithReturnDoc<PaymentProvider> & {
  // Queries
  count: (query: mongodb.Filter<PaymentProvider>) => Promise<number>;
  findProvider: (
    query: mongodb.Filter<PaymentProvider> & {
      paymentProviderId: string;
    },
    options?: mongodb.FindOptions,
  ) => Promise<PaymentProvider>;
  findProviders: (
    query: mongodb.Filter<PaymentProvider>,
    options?: mongodb.FindOptions,
  ) => Promise<Array<PaymentProvider>>;

  providerExists: (query: { paymentProviderId: string }) => Promise<boolean>;

  // Payment adapter
  findSupported: (
    query: { order: Order },
    unchainedAPI: UnchainedCore,
  ) => Promise<Array<PaymentProvider>>;
  determineDefault: (
    paymentProviders: Array<PaymentProvider>,
    params: { order: Order; paymentCredentials?: Array<PaymentCredentials> },
    unchainedAPI: UnchainedCore,
  ) => Promise<PaymentProvider>;

  findInterface: (query: PaymentProvider) => PaymentInterface;
  findInterfaces: (query: { type: PaymentProviderType }) => Array<PaymentInterface>;

  pricingSheet: (params: {
    calculation: Array<PaymentPricingCalculation>;
    currency: string;
  }) => IPaymentPricingSheet;

  configurationError: (
    paymentProvider: PaymentProvider,
    unchainedAPI: UnchainedCore,
  ) => Promise<PaymentError>;

  isActive: (paymentProvider: PaymentProvider, unchainedAPI: UnchainedCore) => Promise<boolean>;

  isPayLaterAllowed: (paymentProvider: PaymentProvider, unchainedAPI: UnchainedCore) => Promise<boolean>;

  calculate: (
    pricingContext: PaymentPricingContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<Array<PaymentPricingCalculation>>;

  charge: (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<PaymentChargeActionResult | false>;
  register: (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<any>;
  sign: (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<string>;
  validate: (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<boolean>;
  cancel: (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<boolean>;
  confirm: (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<boolean>;
};

const PAYMENT_PROVIDER_EVENTS: string[] = [
  'PAYMENT_PROVIDER_CREATE',
  'PAYMENT_PROVIDER_UPDATE',
  'PAYMENT_PROVIDER_REMOVE',
];

export const buildFindSelector = ({ type }: mongodb.Filter<PaymentProvider> = {}) => {
  return { ...(type ? { type } : {}), deleted: null };
};

const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_v, index) => results[index]);
};

export const configurePaymentProvidersModule = (
  PaymentProviders: mongodb.Collection<PaymentProvider>,
): PaymentProvidersModules => {
  registerEvents(PAYMENT_PROVIDER_EVENTS);

  const mutations = generateDbMutations<PaymentProvider>(
    PaymentProviders,
    PaymentProvidersSchema,
  ) as ModuleMutations<PaymentProvider>;

  const getPaymentAdapter = async (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    unchainedAPI: UnchainedCore,
  ) => {
    const provider = await PaymentProviders.findOne(generateDbFilterById(paymentProviderId), {});

    return PaymentDirector.actions(provider, paymentContext, unchainedAPI);
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

    findProviders: async (query, options = { sort: { created: 1 } }) => {
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

    findSupported: async (paymentContext, unchainedAPI) => {
      const allProviders = await PaymentProviders.find({ deleted: null }).toArray();
      const providers: PaymentProvider[] = await asyncFilter(
        allProviders,
        async (provider: PaymentProvider) => {
          try {
            const director = await PaymentDirector.actions(provider, paymentContext, unchainedAPI);
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
        unchainedAPI,
      );
    },

    determineDefault: async (paymentProviders, deliveryContext, unchainedAPI) => {
      return paymentSettings.determineDefaultProvider(
        {
          providers: paymentProviders,
          ...deliveryContext,
        },
        unchainedAPI,
      );
    },

    // Payment Adapter

    configurationError: async (paymentProvider, unchainedAPI) => {
      const actions = await PaymentDirector.actions(paymentProvider, {}, unchainedAPI);
      return actions.configurationError();
    },

    calculate: async (pricingContext, unchainedAPI) => {
      const pricing = await PaymentPricingDirector.actions(pricingContext, unchainedAPI);
      return pricing.calculate();
    },

    isActive: async (paymentProvider, unchainedAPI) => {
      const actions = await PaymentDirector.actions(paymentProvider, {}, unchainedAPI);
      return actions.isActive();
    },

    isPayLaterAllowed: async (paymentProvider, unchainedAPI) => {
      const actions = await PaymentDirector.actions(paymentProvider, {}, unchainedAPI);
      return actions.isPayLaterAllowed();
    },

    charge: async (paymentProviderId, paymentContext, unchainedAPI) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, unchainedAPI);
      return adapter.charge();
    },

    register: async (paymentProviderId, paymentContext, unchainedAPI) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, unchainedAPI);
      return adapter.register();
    },

    sign: async (paymentProviderId, paymentContext, unchainedAPI) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, unchainedAPI);
      return adapter.sign();
    },

    validate: async (paymentProviderId, paymentContext, unchainedAPI) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, unchainedAPI);
      return adapter.validate();
    },

    cancel: async (paymentProviderId, paymentContext, unchainedAPI) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, unchainedAPI);
      return adapter.cancel();
    },

    confirm: async (paymentProviderId, paymentContext, unchainedAPI) => {
      const adapter = await getPaymentAdapter(paymentProviderId, paymentContext, unchainedAPI);
      return adapter.confirm();
    },

    // Mutations
    create: async (doc) => {
      const Adapter = PaymentDirector.getAdapter(doc.adapterKey);
      if (!Adapter) return null;

      const paymentProviderId = await mutations.create({
        configuration: Adapter.initialConfiguration,
        ...doc,
      });

      const paymentProvider = await PaymentProviders.findOne(
        generateDbFilterById(paymentProviderId),
        {},
      );
      await emit('PAYMENT_PROVIDER_CREATE', { paymentProvider });
      return paymentProvider;
    },

    update: async (_id: string, doc: PaymentProvider) => {
      await mutations.update(_id, doc);
      const paymentProvider = await PaymentProviders.findOne(generateDbFilterById(_id), {});
      await emit('PAYMENT_PROVIDER_UPDATE', { paymentProvider });
      return paymentProvider;
    },

    delete: async (_id) => {
      await mutations.delete(_id);
      const paymentProvider = await PaymentProviders.findOne(generateDbFilterById(_id), {});
      await emit('PAYMENT_PROVIDER_REMOVE', { paymentProvider });
      return paymentProvider;
    },

    deletePermanently: async (_id) => {
      const deliveryProvider = await PaymentProviders.findOne(generateDbFilterById(_id), {});
      await mutations.deletePermanently(_id);
      return deliveryProvider;
    },
  };
};
