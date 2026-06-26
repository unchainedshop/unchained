/**
 * AWS EventBridge Event Emitter Adapter
 *
 * NOTE: This file uses a different pattern than the plugin architecture.
 * Events adapters implement the EmitAdapter interface and are registered
 * explicitly via setEmitAdapter() instead of the standard IPlugin pattern:
 *
 *   import { setEmitAdapter } from '@unchainedshop/events';
 *   import { EventBridgeEventEmitter } from '@unchainedshop/plugins/events/aws-eventbridge';
 *   setEmitAdapter(await EventBridgeEventEmitter({ region, source, busName }));
 */
import type { EmitAdapter } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:eventbridge');

export const EventBridgeEventEmitter = async ({ region, source, busName }): Promise<EmitAdapter> => {
  // eslint-disable-next-line
  // @ts-expect-error
  const { EventBridgeClient, PutEventsCommand } = await import('@aws-sdk/client-eventbridge');
  const ebClient = new EventBridgeClient({ region });

  return {
    publish: (eventName, payload) => {
      ebClient
        .send(
          new PutEventsCommand({
            Entries: [
              {
                Source: source,
                DetailType: eventName,
                EventBusName: busName,
                Detail: JSON.stringify(payload),
              },
            ],
          }),
        )
        .catch((e) => {
          logger.warn(e);
        });
    },
    subscribe: () => {
      throw new Error("You can't subscribe to EventBridge connected Events");
    },
    shutdown: () => {
      ebClient.destroy();
    },
  };
};

export default EventBridgeEventEmitter;
