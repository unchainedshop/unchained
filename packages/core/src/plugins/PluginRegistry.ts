import type { UnchainedCore } from '../core-index.ts';
import { createLogger } from '@unchainedshop/logger';
import type { IBaseAdapter } from '@unchainedshop/utils';
import type { mongodb } from '@unchainedshop/mongodb';

const logger = createLogger('unchained:core');

/**
 * HTTP route definition using WHATWG Fetch API
 *
 * This uses standard web APIs (Request/Response) making handlers familiar
 * to developers and compatible with modern JavaScript environments.
 */
export interface PluginHttpRoute {
  /** Route path (e.g., /payment/webhook or /files/:directoryName/:fileName) */
  path: string;

  /** HTTP method(s) to match */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'ALL';

  /**
   * Handler function using WHATWG Fetch API
   *
   * @param request - Standard WHATWG Request object (same as browser fetch API)
   * @param context - Unchained context including modules, services, and request metadata
   * @returns Standard WHATWG Response object
   *
   * @example
   * ```typescript
   * handler: async (request, context) => {
   *   const url = new URL(request.url);
   *   const signature = url.searchParams.get('signature');
   *
   *   if (!signature) {
   *     return new Response('Missing signature', { status: 400 });
   *   }
   *
   *   const data = await request.json();
   *   await context.services.orders.processWebhook(data);
   *
   *   return Response.json({ success: true });
   * }
   * ```
   */
  handler: (
    request: Request,
    context: UnchainedCore & {
      /** URL path parameters extracted from route pattern */
      params: Record<string, string>;
      /** Authenticated user ID if present */
      userId?: string;
      /** Impersonator user ID if present */
      impersonatorId?: string;
    },
  ) => Response | Promise<Response>;
}

/**
 * Module factory function
 * Returns module configuration object that will be merged into platform modules
 */
export type PluginModuleFactory = (options: { db: mongodb.Db }) => Record<string, any>;

/**
 * Unified Plugin Interface
 * Each plugin is a self-contained bounded context following DDD principles
 */
export interface IPlugin {
  /** Unique plugin identifier (e.g., 'shop.unchained.gridfs') */
  key: string;

  /** Human-readable plugin name */
  label: string;

  /** Plugin version (semantic versioning) */
  version: string;

  /**
   * Adapters to register
   * Each adapter declares its type via `adapterType: Symbol.for('unchained:adapter:xxx')`
   * The PluginRegistry will auto-register adapters to their respective Directors based on this symbol
   */
  adapters?: IBaseAdapter[];

  /**
   * Module factory (optional - for plugins needing database access)
   * Returns a module object with methods that will be merged into platform modules
   */
  module?: PluginModuleFactory;

  /**
   * HTTP routes (optional - for plugins needing webhooks/endpoints)
   * Routes use standard WHATWG Fetch API (Request/Response)
   * Making them familiar to developers and compatible with modern JavaScript
   */
  routes?: PluginHttpRoute[];

  /**
   * Lifecycle hook: Called during platform initialization
   * Use this to register event handlers, schedule workers, etc.
   *
   * @returns false to skip adapter registration for this plugin, void/true to proceed normally
   * @throws Error to skip adapter registration with the error message as the reason
   */
  onRegister?: (unchainedAPI: UnchainedCore) => void | boolean | Promise<void | boolean>;

  /**
   * Lifecycle hook: Called during platform shutdown
   * Use this to cleanup resources, close connections, etc.
   */
  onShutdown?: (unchainedAPI: UnchainedCore) => void | Promise<void>;
}

/**
 * PluginRegistry
 *
 * Central registry for all plugins.
 * Manages plugin registration, module factories, adapter registration, and route mounting.
 */
class PluginRegistry {
  private plugins = new Map<string, IPlugin>();
  private moduleFactories: PluginModuleFactory[] = [];
  private skippedPlugins = new Set<string>();

  /**
   * Register a plugin
   * This is the SINGLE registration point for all plugin concerns
   *
   * @param plugin Plugin to register
   */
  register(plugin: IPlugin): void {
    if (this.plugins.has(plugin.key)) {
      logger.warn(`Plugin ${plugin.key} already registered, skipping`, {
        label: plugin.label,
      });
      return;
    }

    logger.info(`Registering plugin: ${plugin.label} (${plugin.key})`, {
      version: plugin.version,
    });

    this.plugins.set(plugin.key, plugin);

    // Store module factory for later initialization
    if (plugin.module) {
      this.moduleFactories.push(plugin.module);
    }
  }

  /**
   * Initialize all plugins
   * Called during platform startup BEFORE adapters are registered
   *
   * @param unchainedAPI Unchained core API
   */
  async initialize(unchainedAPI: UnchainedCore): Promise<void> {
    logger.info(`Initializing ${this.plugins.size} plugins`);

    // Track plugins that should skip adapter registration
    const skippedPlugins = new Set<string>();

    // Call onRegister hooks
    for (const plugin of this.plugins.values()) {
      if (plugin.onRegister) {
        try {
          const result = await plugin.onRegister(unchainedAPI);
          // If onRegister returns false, skip adapter registration for this plugin
          if (result === false) {
            skippedPlugins.add(plugin.key);
            logger.warn(`Plugin ${plugin.key} skipped adapter registration`, {
              label: plugin.label,
            });
          } else {
            logger.debug(`Plugin ${plugin.key} initialized`, {
              label: plugin.label,
            });
          }
        } catch (error) {
          // Thrown errors skip plugin registration with the error message as the reason
          skippedPlugins.add(plugin.key);
          const reason = error instanceof Error ? error.message : String(error);
          logger.warn(`Plugin ${plugin.key} skipped adapter registration - ${reason}`, {
            label: plugin.label,
          });
        }
      }
    }

    // Store skipped plugins for logging purposes
    this.skippedPlugins = skippedPlugins;
  }

  /**
   * Get all module factories for platform initialization
   * @returns Array of module factory functions
   */
  getModuleFactories(): PluginModuleFactory[] {
    return this.moduleFactories;
  }

  /**
   * Get all HTTP routes for mounting
   * Routes from skipped plugins (those whose onRegister returned false) are excluded
   * @returns Array of route definitions
   */
  getRoutes(): PluginHttpRoute[] {
    const routes: PluginHttpRoute[] = [];

    for (const plugin of this.plugins.values()) {
      // Skip routes from plugins that were skipped during initialization
      if (this.skippedPlugins.has(plugin.key)) {
        continue;
      }

      if (plugin.routes) {
        routes.push(...plugin.routes);
      }
    }

    return routes;
  }

  /**
   * Shutdown all plugins
   * Called during platform shutdown
   *
   * @param unchainedAPI Unchained core API
   */
  async shutdown(unchainedAPI: UnchainedCore): Promise<void> {
    logger.info('Shutting down plugins');

    for (const plugin of this.plugins.values()) {
      if (plugin.onShutdown) {
        try {
          await plugin.onShutdown(unchainedAPI);
          logger.debug(`Plugin ${plugin.key} shutdown complete`, {
            label: plugin.label,
          });
        } catch (error) {
          logger.error(`Error shutting down plugin ${plugin.key}`, {
            error: error instanceof Error ? error.message : String(error),
          });
          // Continue shutting down other plugins even if one fails
        }
      }
    }
  }

  /**
   * Get registered plugin by key
   * @param key Plugin key
   * @returns Plugin or undefined if not found
   */
  getPlugin(key: string): IPlugin | undefined {
    return this.plugins.get(key);
  }

  /**
   * Get all registered plugins
   * @returns Array of plugins
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all adapters of a specific type across all plugins
   * Uses the `adapterType` symbol defined on base adapters for type discrimination
   *
   * @param adapterType Symbol identifying the adapter type (e.g., PaymentAdapter.adapterType)
   * @returns Array of adapters matching the specified type
   *
   * @example
   * ```typescript
   * import { PaymentAdapter } from '@unchainedshop/core';
   * const paymentAdapters = pluginRegistry.getAdapters(PaymentAdapter.adapterType);
   * ```
   */
  getAdapters(adapterType: symbol): IBaseAdapter[] {
    const result: IBaseAdapter[] = [];

    for (const plugin of this.plugins.values()) {
      if (!plugin.adapters) continue;

      for (const adapter of plugin.adapters) {
        if (adapter.adapterType === adapterType) {
          result.push(adapter);
        }
      }
    }

    return result;
  }

  /**
   * Check if a plugin is registered
   * @param key Plugin key
   * @returns true if plugin is registered
   */
  hasPlugin(key: string): boolean {
    return this.plugins.has(key);
  }

  /**
   * Clear all registered plugins
   * WARNING: This is primarily for testing purposes
   */
  clear(): void {
    this.plugins.clear();
    this.moduleFactories = [];
    this.skippedPlugins.clear();
  }
}

/**
 * Global plugin registry singleton
 */
export const pluginRegistry = new PluginRegistry();
