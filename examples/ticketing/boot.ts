import Fastify from 'fastify';
import { startPlatform } from '@unchainedshop/platform';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
import { SendMessagePlugin } from '@unchainedshop/plugins/delivery/send-message';
import { pluginRegistry } from '@unchainedshop/core';
import { connect, unchainedLogger } from '@unchainedshop/api/fastify';
import {
  createTicketingPlugin,
  validateTicketOrderPosition,
  withTicketing,
} from '@unchainedshop/ticketing';
import { createTicketWarehousingPlugin } from '@unchainedshop/ticketing/warehousing/ticket';
import { ReimbursementCodePlugin } from '@unchainedshop/ticketing/pricing/discount-reimbursement-code';
import { ticketingAdminPlugin } from '@unchainedshop/ticketing/admin-plugin';
import seed from './seed.ts';

const fastify = Fastify({
  loggerInstance: unchainedLogger('fastify'),
  disableRequestLogging: true,
  trustProxy: true,
});

try {
  // Register all plugins before starting the platform
  registerBasePlugins();
  // seed.ts creates a send-message delivery provider, which the base preset does not include
  pluginRegistry.register(SendMessagePlugin);

  // Passes module, ticket PDF and wallet routes, magic keys and cancellation e-mails. The example
  // passes no renderers, so the PDF and wallet routes answer 404: see the ticket renderers guide
  // (docs/docs/guides/ticketing-renderers.md) for renderOrderPDF, createAppleWalletPass and
  // createGoogleWalletPass.
  pluginRegistry.register(createTicketingPlugin());

  // The ticket issuer; seed.ts creates the one VIRTUAL warehousing provider that uses it.
  pluginRegistry.register(
    createTicketWarehousingPlugin({
      // Attendee names for gate staff, one per seat: the storefront sends them as the order
      // position configuration `attendees`, e.g. [{ key: "attendees", value: "Ada, Alan" }].
      ticketMeta: ({ orderPosition, index }) => {
        const attendees = orderPosition.configuration
          ?.find(({ key }) => key === 'attendees')
          ?.value?.split(',');
        const attendeeName = attendees?.[index]?.trim();
        return attendeeName ? { attendeeName } : undefined;
      },
    }),
  );

  // Redeems the reimbursement codes cancelTicket / cancelEvent issue with generateDiscount
  // (signed with DISCOUNT_CODE_SECRET)
  pluginRegistry.register(ReimbursementCodePlugin);

  // withTicketing adds the ticketing GraphQL schema, services, actions and the `ticketing` role
  const platform = await startPlatform(
    withTicketing({
      options: {
        orders: {
          // Keeps ticket sales within the supply and refuses tickets of cancelled events
          validateOrderPosition: validateTicketOrderPosition,
        },
      },
    }),
  );

  // Mounts the plugin routes (including the ticketing routes) before the Admin UI
  await connect(fastify, platform, {
    allowRemoteToLocalhostSecureCookies: process.env.NODE_ENV !== 'production',
    adminUI: {
      plugins: [ticketingAdminPlugin()],
    },
  });

  await seed(platform.unchainedAPI);

  // Warning: Do not use this in production - creates access token for bulk import API
  const result = await platform.unchainedAPI.modules.users.createAccessToken('admin');
  if (result) {
    fastify.log.info(`Access token for admin: ${result.token}`);
  }

  await fastify.listen({ host: '::', port: process.env.PORT ? parseInt(process.env.PORT) : 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
