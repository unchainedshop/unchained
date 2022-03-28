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
import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
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

const buildFindSelector = ({ type }: FindQuery = {}) => {
  return { ...(type ? { type } : {}), deleted: null };
};

export const configurePaymentProvidersModule = (
  PaymentProviders: Collection<PaymentProvider>,
  paymentProviderOptions: PaymentProvidersSettingsOptions,
): PaymentModule['paymentProviders'] => {
  registerEvents(PAYMENT_PROVIDER_EVENTS);

  paymentProviderSettings.configureSettings(paymentProviderOptions);

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
      return {
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      };
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

    findSupported: async ({ order }, requestContext) => {
      const providers = (await PaymentProviders.find({ deleted: null }).toArray()).filter(
        (provider: PaymentProvider) => {
          const director = PaymentDirector.actions(provider, { order }, requestContext);
          return director.isActive();
        },
      );

      return paymentProviderSettings.filterSupportedProviders(
        {
          providers,
          order,
        },
        requestContext,
      );
    },

    // Payment Adapter

    configurationError: (paymentProvider, requestContext) => {
      return PaymentDirector.actions(paymentProvider, {}, requestContext).configurationError();
    },

    calculate: async (pricingContext, requestContext) => {
      const pricing = await PaymentPricingDirector.actions(pricingContext, requestContext);
      return pricing.calculate();
    },

    isActive: (paymentProvider, requestContext) => {
      return PaymentDirector.actions(paymentProvider, {}, requestContext).isActive();
    },

    isPayLaterAllowed: (paymentProvider, requestContext) => {
      return PaymentDirector.actions(paymentProvider, {}, requestContext).isPayLaterAllowed();
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

      const paymentProvider = await PaymentProviders.findOne(generateDbFilterById(paymentProviderId));
      emit('PAYMENT_PROVIDER_CREATE', { paymentProvider });

      return paymentProvider;
    },

    update: async (_id: string, doc: PaymentProvider, userId: string) => {
      await mutations.update(_id, doc, userId);
      const paymentProvider = await PaymentProviders.findOne(generateDbFilterById(_id));
      emit('PAYMENT_PROVIDER_UPDATE', { paymentProvider });

      return paymentProvider;
    },

    delete: async (_id, userId) => {
      await mutations.delete(_id, userId);
      const paymentProvider = await PaymentProviders.findOne(generateDbFilterById(_id));

      emit('PAYMENT_PROVIDER_REMOVE', { paymentProvider });

      return paymentProvider;
    },
  };
};
