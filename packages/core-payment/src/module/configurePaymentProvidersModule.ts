import { Context } from '@unchainedshop/types/api';
import { Collection, ModuleMutations } from '@unchainedshop/types/common';
import {
  PaymentContext,
  PaymentModule,
  PaymentProvider,
  PaymentProvidersSettingsOptions,
  PaymentProviderType,
} from '@unchainedshop/types/payments';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { PaymentPricingDirector } from '../director/PaymentPricingDirector';
import { PaymentProvidersSchema } from '../db/PaymentProvidersSchema';
import { PaymentDirector } from '../director/PaymentDirector';
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
  PaymentProviders: Collection<PaymentProvider>,
  options: PaymentProvidersSettingsOptions
): PaymentModule['paymentProviders'] => {
  registerEvents(PAYMENT_PROVIDER_EVENTS);

  paymentProviderSettings.configureSettings(options);

  const mutations = generateDbMutations<PaymentProvider>(
    PaymentProviders,
    PaymentProvidersSchema
  ) as ModuleMutations<PaymentProvider>;

  const getPaymentAdapter = async (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    requestContext: Context
  ) => {
    const provider = await PaymentProviders.findOne(
      generateDbFilterById(paymentProviderId)
    );

    return PaymentDirector.actions(provider, paymentContext, requestContext);
  };

  return {
    // Queries
    count: async (query) => {
      const providerCount = await PaymentProviders.find(
        buildFindSelector(query)
      ).count();
      return providerCount;
    },

    /* @ts-ignore */
    findProvider: async ({ paymentProviderId, ...query }, options) => {
      return await PaymentProviders.findOne(
        paymentProviderId ? generateDbFilterById(paymentProviderId) : query,
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
        generateDbFilterById(paymentProviderId, { deleted: null }),
        { limit: 1 }
      ).count();
      return !!providerCount;
    },

    findInterface: (paymentProvider) => {
      const Adapter = PaymentDirector.getAdapter(paymentProvider.adapterKey);
      return {
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      };
    },

    findInterfaces: ({ type }) => {
      return PaymentDirector.getAdapters()
        .filter((Adapter) => {
          Adapter.typeSupported(type);
        })
        .map((Adapter) => ({
          _id: Adapter.key,
          label: Adapter.label,
          version: Adapter.version,
        }));
    },

    findSupported: async ({ order }, requestContext) => {
      const providers = await PaymentProviders.find({}).filter(
        (provider: PaymentProvider) => {
          const director = PaymentDirector.actions(
            provider,
            getDefaultContext(order),
            requestContext
          );
          return director.isActive();
        }
      ).toArray();

      return paymentProviderSettings.filterSupportedProviders({
        providers,
        order,
      });
    },

    // Payment Adapter

    configurationError: async (paymentProvider, requestContext) => {
      return await PaymentDirector.actions(
        paymentProvider,
        getDefaultContext(),
        requestContext
      ).configurationError();
    },

    calculate: async (pricingContext, requestContext) => {
      const pricing = await PaymentPricingDirector.actions(
        pricingContext,
        requestContext
      );
      return await pricing.calculate();
    },

    isActive: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(
        paymentProviderId,
        paymentContext,
        requestContext
      );
      return adapter.isActive();
    },
    isPayLaterAllowed: async (
      paymentProviderId,
      paymentContext,
      requestContext
    ) => {
      const adapter = await getPaymentAdapter(
        paymentProviderId,
        paymentContext,
        requestContext
      );
      
      return adapter.isPayLaterAllowed();
    },

    charge: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(
        paymentProviderId,
        paymentContext,
        requestContext
      );
      adapter.charge();
    },

    register: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(
        paymentProviderId,
        paymentContext,
        requestContext
      );
      adapter.register();
    },

    sign: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(
        paymentProviderId,
        paymentContext,
        requestContext
      );
      return adapter.sign();
    },

    validate: async (paymentProviderId, paymentContext, requestContext) => {
      const adapter = await getPaymentAdapter(
        paymentProviderId,
        paymentContext,
        requestContext
      );
      return adapter.validate();
    },

    // Mutations
    create: async (doc, userId) => {
      const Adapter = PaymentDirector.getAdapter(doc.adapterKey);
      if (!Adapter) return null;

      const paymentProviderId = await mutations.create(
        {
          created: new Date(),
          configuration: Adapter.initialConfiguration,
          ...doc,
        },
        userId
      );

      const paymentProvider = await PaymentProviders.findOne(
        generateDbFilterById(paymentProviderId)
      );
      emit('PAYMENT_PROVIDER_CREATE', { paymentProvider });
      return paymentProviderId;
    },

    update: async (_id: string, doc: PaymentProvider, userId: string) => {
      const paymentProviderId = await mutations.update(_id, doc, userId);
      const paymentProvider = await PaymentProviders.findOne(
        generateDbFilterById(_id)
      );
      emit('PAYMENT_PROVIDER_UPDATE', { paymentProvider });

      return paymentProviderId;
    },

    delete: async (_id, userId) => {
      const deletedCount = await mutations.delete(_id, userId);
      const paymentProvider = PaymentProviders.findOne(
        generateDbFilterById(_id)
      );

      emit('PAYMENT_PROVIDER_REMOVE', { paymentProvider });
      return deletedCount;
    },
  };
};
