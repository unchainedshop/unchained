import {
  PaymentContext,
  PaymentModule,
  PaymentProvider,
  PaymentProviderType,
} from '@unchainedshop/types/payments';
import { Collection } from '@unchainedshop/types';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbMutations } from 'meteor/unchained:utils';
import { PaymentProvidersSchema } from '../db/PaymentProvidersSchema';
import { PaymentAdapter } from '../director/PaymentAdapter';
import {
  getAdapter,
  getFilteredAdapters,
  PaymentDirector,
} from '../director/PaymentDirector';
import { paymentProviderSettings } from './configurePaymentProvidersSettings';

const PAYMENT_PROVIDER_EVENTS: string[] = [
  'PAYMENT_PROVIDER_CREATE',
  'PAYMENT_PROVIDER_UPDATE',
  'PAYMENT_PROVIDER_REMOVE',
];

type FindQuery = {
  type?: PaymentProviderType;
  deleted?: Date | null;
};

const buildFindSelector = ({ type, deleted = null }: FindQuery = {}) => {
  return { ...(type ? { type } : {}), deleted };
};

const getDefaultContext = (context?: PaymentContext): PaymentContext => {
  return context || {};
};

export const configurePaymentProvidersModule = (
  PaymentProviders: Collection<PaymentProvider>
): PaymentModule['paymentProviders'] => {
  registerEvents(PAYMENT_PROVIDER_EVENTS);
  
  const mutations = generateDbMutations<PaymentProvider>(
    PaymentProviders,
    PaymentProvidersSchema
  );

  const getPaymentAdapter = async (
    paymentProviderId: string,
    context: PaymentContext
  ) => {
    const provider = await PaymentProviders.findOne({
      _id: paymentProviderId,
    });

    return PaymentDirector(provider, getDefaultContext(context));
  };

  return {
    // Queries
    count: async (query) => {
      const providerCount = await PaymentProviders.find(
        buildFindSelector(query)
      ).count();
      return providerCount;
    },

    findProvider: async ({ paymentProviderId, ...query }, options) => {
      return await PaymentProviders.findOne(
        { _id: paymentProviderId, ...query },
        options
      );
    },

    findProviders: async (query, options) => {
      const providers = PaymentProviders.find(
        buildFindSelector(query),
        options
      );
      return await providers.toArray();
    },

    providerExists: async ({ paymentProviderId }) => {
      const providerCount = await PaymentProviders.find(
        { _id: paymentProviderId, deleted: null },
        { limit: 1 }
      ).count();
      return !!providerCount;
    },

    findInterface: (paymentProvider) => {
      const Adapter = getAdapter(paymentProvider);
      return {
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      };
    },

    findInterfaces: ({ type }) => {
      return getFilteredAdapters((Adapter: typeof PaymentAdapter) =>
        Adapter.typeSupported(type)
      ).map((Adapter) => ({
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      }));
    },

    findSupported: ({ order }) => {
      const providers = PaymentProviders.find({}).filter(
        (provider: PaymentProvider) => {
          const director = PaymentDirector(provider, getDefaultContext(order));
          return director.isActive();
        }
      );

      return paymentProviderSettings.filterSupportedProviders({
        providers,
        order,
      });
    },

    // Payment Adapter

    configurationError: (paymentProvider) => {
      return PaymentDirector(paymentProvider).configurationError();
    },

    isActive: async (paymentProviderId, context) => {
      const adapter = await getPaymentAdapter(paymentProviderId, context);
      return adapter.isActive();
    },
    isPayLaterAllowed: async (paymentProviderId, context) => {
      const adapter = await getPaymentAdapter(paymentProviderId, context);
      return adapter.isPayLaterAllowed();
    },

    charge: async (paymentProviderId, context) => {
      const adapter = await getPaymentAdapter(paymentProviderId, context);
      adapter.charge();
    },

    register: async (paymentProviderId, context) => {
      const adapter = await getPaymentAdapter(paymentProviderId, context);
      adapter.register();
    },

    sign: async (paymentProviderId, context) => {
      const adapter = await getPaymentAdapter(paymentProviderId, context);
      adapter.sign();
    },

    validate: async (paymentProviderId, context) => {
      const adapter = await getPaymentAdapter(paymentProviderId, context);
      adapter.validate();
    },

    // Mutations
    create: async (doc, userId) => {
      const Adapter = getAdapter(doc);
      if (!Adapter) return null;

      const paymentProviderId = await mutations.create(
        {
          created: new Date(),
          configuration: Adapter.initialConfiguration,
          ...doc,
        },
        userId
      );

      const paymentProvider = await PaymentProviders.findOne({
        _id: paymentProviderId,
      });
      emit('PAYMENT_PROVIDER_CREATE', { paymentProvider });
      return paymentProviderId;
    },

    update: async (_id: string, doc: PaymentProvider, userId: string) => {
      const paymentProviderId = await mutations.update(_id, doc, userId);
      const paymentProvider = await PaymentProviders.findOne({ _id });
      emit('PAYMENT_PROVIDER_UPDATE', { paymentProvider });

      return paymentProviderId;
    },

    delete: async (_id, userId) => {
      const deletedCount = await mutations.delete(_id, userId);
      const paymentProvider = PaymentProviders.findOne({ _id });

      emit('PAYMENT_PROVIDER_REMOVE', { paymentProvider });
      return deletedCount;
    },
  };
};
