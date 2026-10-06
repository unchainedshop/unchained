import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { MessagingDirector } from '@unchainedshop/core';
import { roles } from '@unchainedshop/api';
import { EventEmitter } from 'node:events';
import { WorkerEventTypes } from '@unchainedshop/core-worker';
import { emit, getEmitAdapter, registerEvents, setEmitAdapter } from '@unchainedshop/events';
import { createTicketingPlugin } from './plugin.ts';
import { withTicketing } from './with-ticketing.ts';
import { RendererTypes, getRenderer, renderers } from './template-registry.ts';
import {
  TicketingMessageTypes,
  registerTicketingTemplates,
  resolveEventCancelledTemplate,
  resolveTicketCancelledTemplate,
} from './templates/index.ts';
import ticketingServices from './services.ts';
import { ticketingActions, ticketingResolvers, ticketingTypeDefs } from './api/index.ts';

const defaultTemplates = {
  [TicketingMessageTypes.EVENT_CANCELLED]: resolveEventCancelledTemplate,
  [TicketingMessageTypes.TICKET_CANCELLED]: resolveTicketCancelledTemplate,
};

// Hooks stay inside this suite: at the top level they would wrap every test of a shared-process run
describe('ticketing plugin', () => {
  // Renderers, templates and env are process-wide; restore what other suites set up.
  let registeredRenderers: Map<string, any>;
  let registeredTemplates: Record<string, any>;
  let unchainedSecret: string | undefined;
  // onRegister subscribes to events; a throwaway emitter keeps the fake modules from reacting to
  // the events of later suites in the same process
  let previousAdapter: ReturnType<typeof getEmitAdapter>;
  // onRegister adds the magic-key rules to the configured roles; a throwaway role set keeps them
  // away from the roles of a platform in the same process
  let restoreRoles: () => void;
  beforeEach(() => {
    restoreRoles = roles.snapshotConfiguredRoles();
    roles.configureRoles({});
    previousAdapter = getEmitAdapter();
    const emitter = new EventEmitter();
    setEmitAdapter({
      publish: (eventName, data) => emitter.emit(eventName, data),
      subscribe: (eventName, callback) => emitter.on(eventName, callback),
    });
    registeredRenderers = new Map(renderers);
    registeredTemplates = Object.fromEntries(
      Object.keys(defaultTemplates).map((name) => [name, MessagingDirector.getTemplate(name)]),
    );
    unchainedSecret = process.env.UNCHAINED_SECRET;
  });
  afterEach(() => {
    renderers.clear();
    for (const [type, renderer] of registeredRenderers) renderers.set(type, renderer);
    for (const [name, template] of Object.entries(registeredTemplates)) {
      MessagingDirector.registerTemplate(name, template || defaultTemplates[name]);
    }
    if (unchainedSecret === undefined) delete process.env.UNCHAINED_SECRET;
    else process.env.UNCHAINED_SECRET = unchainedSecret;
    setEmitAdapter(previousAdapter);
    restoreRoles();
  });

  const unchainedAPI = { modules: {}, services: {} } as any;

  test('createTicketingPlugin bundles the passes module and the ticketing routes', () => {
    const plugin = createTicketingPlugin();
    assert.equal(plugin.key, 'shop.unchained.ticketing');
    assert.equal(typeof plugin.module, 'function');
    assert.ok(
      plugin.routes?.some(({ method, path }) => method === 'GET' && path === '/rest/print_tickets'),
    );
    assert.ok(
      plugin.routes?.some(
        ({ method, path }) => method === 'POST' && path === '/rest/apple-wallet/v1/log',
      ),
    );
  });

  test('the passes module refuses to start without UNCHAINED_SECRET', () => {
    delete process.env.UNCHAINED_SECRET;
    assert.throws(
      () => createTicketingPlugin().module!({ db: {} as any }),
      (error: Error) => error.cause === 'TICKETING_SECRET_MISSING',
    );
  });

  test('the passes module receives the discount code handlers unchanged', async () => {
    process.env.UNCHAINED_SECRET = 'secret';
    const discountCode = { generate: async () => 'code', verify: async () => null };
    const server = await MongoMemoryServer.create();
    const client = new MongoClient(server.getUri());
    try {
      await client.connect();
      const { passes } = createTicketingPlugin({ discountCode }).module!({ db: client.db('ticketing') });
      const module = await passes;
      assert.equal(module.generateDiscountCode, discountCode.generate);
      assert.equal(module.verifyDiscountCode, discountCode.verify);
    } finally {
      await client.close();
      await server.stop();
    }
  });

  test('onRegister registers the given renderers and the magic-key rules', async () => {
    renderers.clear();
    const permissions = roles.configureRoles({});
    const renderOrderPDF = async () => null as any;
    const createGoogleWalletPass = async () => 'https://pay.google.com/gp/v/save/jwt';
    await createTicketingPlugin({ renderOrderPDF, createGoogleWalletPass }).onRegister!(unchainedAPI);

    assert.equal(getRenderer(RendererTypes.ORDER_PDF), renderOrderPDF);
    assert.equal(getRenderer(RendererTypes.GOOGLE_WALLET), createGoogleWalletPass);
    assert.equal(renderers.has(RendererTypes.APPLE_WALLET), false);

    const context = {
      getHeader: () => undefined,
      modules: {
        orders: { findOrder: async () => ({ _id: 'order' }) },
        passes: { buildMagicKey: async () => 'magic-key' },
      },
    };
    const canView = (otp: string) =>
      permissions.userHasPermission(context as any, 'viewOrder', [undefined, { orderId: 'order', otp }]);
    assert.equal(await canView('magic-key'), true);
    assert.equal(await canView('other-key'), false);
  });

  test('ticketing registers its cancellation templates only where none exist', () => {
    registerTicketingTemplates();
    for (const [name, template] of Object.entries(defaultTemplates)) {
      assert.equal(MessagingDirector.getTemplate(name), registeredTemplates[name] || template);
    }
  });

  test('a project cancellation template wins over the default in both registration orders', async () => {
    // Registered before the platform starts, e.g. by a messages setup that runs first.
    const projectTicketCancelled = async () => [];
    MessagingDirector.registerTemplate(TicketingMessageTypes.TICKET_CANCELLED, projectTicketCancelled);
    await createTicketingPlugin().onRegister!(unchainedAPI);
    assert.equal(
      MessagingDirector.getTemplate(TicketingMessageTypes.TICKET_CANCELLED),
      projectTicketCancelled,
    );
    assert.ok(MessagingDirector.getTemplate(TicketingMessageTypes.EVENT_CANCELLED));

    // Registered after the platform started; a later registration of the defaults keeps it.
    const projectEventCancelled = async () => [];
    MessagingDirector.registerTemplate(TicketingMessageTypes.EVENT_CANCELLED, projectEventCancelled);
    await createTicketingPlugin().onRegister!(unchainedAPI);
    assert.equal(
      MessagingDirector.getTemplate(TicketingMessageTypes.EVENT_CANCELLED),
      projectEventCancelled,
    );
    assert.equal(
      MessagingDirector.getTemplate(TicketingMessageTypes.TICKET_CANCELLED),
      projectTicketCancelled,
    );
  });

  test('withTicketing merges ticketing into the platform options without dropping the project ones', () => {
    const projectRole = () => undefined;
    const projectResolvers = { Query: {} };
    const projectService = { hello: () => 'world' };
    const options = withTicketing({
      modules: { custom: { configure: () => ({}) } },
      services: { project: projectService },
      typeDefs: ['type Foo { id: ID }'],
      resolvers: [projectResolvers],
      rolesOptions: { additionalActions: ['projectAction'], additionalRoles: { project: projectRole } },
    });

    assert.ok(options.modules.custom);
    assert.equal(options.services.project, projectService);
    assert.equal((options.services as any).ticketing, ticketingServices.ticketing);
    assert.deepEqual(options.typeDefs, [...ticketingTypeDefs, 'type Foo { id: ID }']);
    assert.deepEqual(options.resolvers, [ticketingResolvers, projectResolvers]);
    assert.deepEqual(options.rolesOptions.additionalActions, [...ticketingActions, 'projectAction']);
    assert.equal(options.rolesOptions.additionalRoles.project, projectRole);
    assert.equal(typeof (options.rolesOptions.additionalRoles as any).ticketing, 'function');

    // Applying it twice must not declare the ticketing schema twice.
    const twice = withTicketing(options);
    assert.deepEqual(twice.typeDefs, options.typeDefs);
    assert.deepEqual(twice.resolvers, options.resolvers);
    assert.deepEqual(twice.rolesOptions.additionalActions, options.rolesOptions.additionalActions);

    const bare = withTicketing({}) as any;
    assert.deepEqual(bare.typeDefs, ticketingTypeDefs);
    assert.deepEqual(bare.resolvers, [ticketingResolvers]);
  });

  test('an Apple renderer refreshes the pass of the invalidated or exported ticket only', async () => {
    registerEvents(['TOKEN_INVALIDATED', WorkerEventTypes.FINISHED]);
    const refreshed: (string | null)[] = [];
    const api = {
      modules: {
        passes: {
          invalidateAppleWalletPasses: async (_api: unknown, token?: { _id: string } | null) => {
            refreshed.push(token?._id ?? null);
          },
        },
      },
    } as any;
    await createTicketingPlugin({ createAppleWalletPass: async () => ({}) as any }).onRegister!(api);

    await emit('TOKEN_INVALIDATED', { token: { _id: 'redeemed' } });
    await emit(WorkerEventTypes.FINISHED, {
      type: 'EXPORT_TOKEN',
      success: true,
      input: { token: { _id: 'exported' } },
    });
    // A changed owner concerns many tickets, so all passes are reconciled.
    await emit(WorkerEventTypes.FINISHED, { type: 'UPDATE_TOKEN_OWNERSHIP', success: true });
    await emit(WorkerEventTypes.FINISHED, { type: 'EXPORT_TOKEN', success: false });
    await new Promise((resolve) => setImmediate(resolve));

    assert.deepEqual(refreshed, ['redeemed', 'exported', null]);
  });
});
