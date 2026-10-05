import { z } from 'zod';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbObjectId, type ModuleInput } from '@unchainedshop/mongodb';
import { memoizeWithTTL } from '@unchainedshop/utils';
import { ShopSettingsCollection } from '../db/ShopSettingsCollection.ts';
import {
  getSettingsNamespace,
  getAllSettingsNamespaces,
  type SettingsNamespaceDefinition,
} from '../settings-registry.ts';

const SETTINGS_EVENTS: string[] = ['SHOP_SETTINGS_UPDATED'];

const SETTINGS_TTL_MS = 30_000;

export const configureSettingsModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  registerEvents(SETTINGS_EVENTS);

  const ShopSettings = await ShopSettingsCollection(db);

  const memoizedGet = memoizeWithTTL(
    async (namespace: string): Promise<Record<string, unknown> | null> => {
      const doc = await ShopSettings.findOne({ namespace });
      if (doc) return doc.value;
      const definition = getSettingsNamespace(namespace);
      if (!definition) return null;
      return definition.schema.parse({}) as Record<string, unknown>;
    },
    { ttl: SETTINGS_TTL_MS },
  );

  return {
    get: async (namespace: string): Promise<Record<string, unknown> | null> => {
      return memoizedGet(namespace);
    },

    set: async (namespace: string, value: Record<string, unknown>): Promise<Record<string, unknown>> => {
      const definition = getSettingsNamespace(namespace);
      if (!definition) {
        throw new Error(`Settings namespace "${namespace}" is not registered`);
      }
      const validated = definition.schema.parse(value) as Record<string, unknown>;
      await ShopSettings.updateOne(
        { namespace },
        {
          $set: { value: validated, updated: new Date() },
          $setOnInsert: { _id: generateDbObjectId(), created: new Date() },
        },
        { upsert: true },
      );
      memoizedGet.delete(namespace);
      await emit('SHOP_SETTINGS_UPDATED', { namespace });
      return validated;
    },

    getJsonSchema: (namespace: string): Record<string, unknown> | null => {
      const definition = getSettingsNamespace(namespace);
      if (!definition) return null;
      return z.toJSONSchema(definition.schema) as Record<string, unknown>;
    },

    isPublic: (namespace: string): boolean => {
      const definition = getSettingsNamespace(namespace);
      return definition?.public ?? false;
    },

    getRegisteredNamespaces: (): string[] => {
      return getAllSettingsNamespaces().map((d) => d.key);
    },

    getNamespaceDefinition: (namespace: string): SettingsNamespaceDefinition | undefined => {
      return getSettingsNamespace(namespace);
    },

    seed: async (): Promise<void> => {
      const namespaces = getAllSettingsNamespaces();
      for (const ns of namespaces) {
        if (ns.defaults) {
          const existing = await ShopSettings.findOne({ namespace: ns.key });
          if (!existing) {
            const validated = ns.schema.parse(ns.defaults) as Record<string, unknown>;
            await ShopSettings.insertOne({
              _id: generateDbObjectId(),
              namespace: ns.key,
              value: validated,
              created: new Date(),
            });
          }
        }
      }
    },
  };
};

export type SettingsModule = Awaited<ReturnType<typeof configureSettingsModule>>;
