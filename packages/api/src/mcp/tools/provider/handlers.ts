import { ProviderType } from '../../modules/configureProviderMcpModule.js';
import { ActionName, Handler } from './schemas.js';

const actionHandlers: { [K in ActionName]: Handler<K> } = {
  CREATE: async (providerModule, { providerType, provider }) => {
    const created = await providerModule.create(
      providerType as ProviderType,
      provider as { type: string; adapterKey: string },
    );

    return { provider: created };
  },

  UPDATE: async (providerModule, { providerType, providerId, configuration }) => {
    const validConfiguration = configuration.filter((c): c is { key: string; value: any } =>
      Boolean(c.key && c.value !== undefined),
    );

    if (validConfiguration.length === 0) {
      throw new Error('At least one valid configuration entry with key and value is required');
    }

    const updated = await providerModule.update(providerType as ProviderType, providerId, {
      configuration: validConfiguration,
    });

    return { provider: updated };
  },

  REMOVE: async (providerModule, { providerType, providerId }) => {
    const existing = await providerModule.remove(providerType as ProviderType, providerId);
    return { provider: existing };
  },

  GET: async (providerModule, { providerType, providerId }) => {
    const provider = await providerModule.get(providerType as ProviderType, providerId);

    if (!provider) {
      return {
        provider: null,
        message: `${providerType.toLowerCase()} provider not found for ID: ${providerId}`,
      };
    }

    return { provider };
  },

  LIST: async (providerModule, { providerType, typeFilter, queryString }) => {
    const providers = await providerModule.list(providerType as ProviderType, {
      typeFilter,
      queryString,
    });

    return { providers };
  },

  INTERFACES: async (providerModule, { providerType, typeFilter }) => {
    const interfaces = await providerModule.getInterfaces(providerType as ProviderType, typeFilter);

    return {
      interfaces,
      providerType,
      typeFilter: typeFilter || null,
    };
  },
};

export default actionHandlers;
