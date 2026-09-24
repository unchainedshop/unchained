import type { z } from 'zod';

export interface SettingsNamespaceDefinition {
  key: string;
  schema: z.ZodType;
  public?: boolean;
  defaults?: Record<string, unknown>;
}

const namespaceRegistry = new Map<string, SettingsNamespaceDefinition>();

export function registerSettingsNamespace(definition: SettingsNamespaceDefinition): void {
  if (namespaceRegistry.has(definition.key)) {
    throw new Error(`Settings namespace "${definition.key}" is already registered`);
  }
  namespaceRegistry.set(definition.key, definition);
}

export function getSettingsNamespace(key: string): SettingsNamespaceDefinition | undefined {
  return namespaceRegistry.get(key);
}

export function getAllSettingsNamespaces(): SettingsNamespaceDefinition[] {
  return Array.from(namespaceRegistry.values());
}
