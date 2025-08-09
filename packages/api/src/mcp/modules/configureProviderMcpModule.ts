import { Context } from '../../context.js';
import { PaymentDirector, DeliveryDirector, WarehousingDirector } from '@unchainedshop/core';
import {
  ProviderConfigurationInvalid,
  PaymentProviderNotFoundError,
  DeliverProviderNotFoundError,
  WarehousingProviderNotFoundError,
} from '../../errors.js';

export type ProviderType = 'PAYMENT' | 'DELIVERY' | 'WAREHOUSING';

export interface ProviderModuleConfig {
  module: any;
  director: any;
  NotFoundError: any;
  idField: string;
}

export interface ProviderEntity {
  type: string;
  adapterKey: string;
}

export interface ProviderUpdateData {
  configuration: {
    key: string;
    value: any;
  }[];
}

export interface ProviderListOptions {
  typeFilter?: string;
  queryString?: string;
}

export const getProviderConfig = (
  context: Context,
  providerType: ProviderType,
): ProviderModuleConfig => {
  switch (providerType) {
    case 'PAYMENT':
      return {
        module: context.modules.payment.paymentProviders,
        director: PaymentDirector,
        NotFoundError: PaymentProviderNotFoundError,
        idField: 'paymentProviderId',
      };
    case 'DELIVERY':
      return {
        module: context.modules.delivery,
        director: DeliveryDirector,
        NotFoundError: DeliverProviderNotFoundError,
        idField: 'deliveryProviderId',
      };
    case 'WAREHOUSING':
      return {
        module: context.modules.warehousing,
        director: WarehousingDirector,
        NotFoundError: WarehousingProviderNotFoundError,
        idField: 'warehousingProviderId',
      };
    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }
};

export const configureProviderMcpModule = (context: Context) => {
  return {
    create: async (providerType: ProviderType, provider: ProviderEntity) => {
      const config = getProviderConfig(context, providerType);
      const Adapter = config.director.getAdapter(provider.adapterKey);

      if (!Adapter) throw new ProviderConfigurationInvalid(provider);

      const created = await config.module.create({
        configuration: Adapter.initialConfiguration,
        ...provider,
      } as any);

      if (!created) throw new ProviderConfigurationInvalid(provider);

      return created;
    },

    update: async (providerType: ProviderType, providerId: string, updateData: ProviderUpdateData) => {
      const config = getProviderConfig(context, providerType);
      const existsParam = { [config.idField]: providerId };

      if (providerType === 'PAYMENT') {
        if (!(await config.module.providerExists(existsParam))) {
          throw new config.NotFoundError(existsParam);
        }
      } else {
        const existing = await config.module.findProvider(existsParam);
        if (!existing) throw new config.NotFoundError(existsParam);
      }

      const updated = await config.module.update(providerId, updateData as any);
      return updated;
    },

    remove: async (providerType: ProviderType, providerId: string) => {
      const config = getProviderConfig(context, providerType);
      const existing = await config.module.findProvider({ [config.idField]: providerId });

      if (!existing) throw new config.NotFoundError({ [config.idField]: providerId });

      await config.module.delete(providerId);
      return existing;
    },

    get: async (providerType: ProviderType, providerId: string) => {
      const config = getProviderConfig(context, providerType);
      const provider = await config.module.findProvider({ [config.idField]: providerId });

      return provider;
    },

    list: async (providerType: ProviderType, options: ProviderListOptions = {}) => {
      const config = getProviderConfig(context, providerType);
      const { typeFilter, queryString } = options;

      const selector: Record<string, any> = {};
      if (typeFilter) selector.type = typeFilter;

      if (queryString) {
        const regex = new RegExp(queryString, 'i');
        selector.$or = [{ _id: regex }, { adapterKey: regex }];
      }

      const providers = await config.module.findProviders(selector);
      return providers;
    },

    getInterfaces: async (providerType: ProviderType, typeFilter?: string) => {
      const config = getProviderConfig(context, providerType);
      let allAdapters = config.director.getAdapters();

      if (typeFilter) {
        allAdapters = allAdapters.filter((adapter: any) => adapter.typeSupported(typeFilter));
      }

      const interfaces = allAdapters.map((Adapter: any) => ({
        adapterKey: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      }));

      return interfaces;
    },
  };
};

export type ProviderMcpModule = ReturnType<typeof configureProviderMcpModule>;
