/**
 * AWS EventBridge Event Emitter Adapter
 *
 * NOTE: This file uses a different pattern than the plugin architecture.
 * Events adapters implement EmitAdapter interface and are registered via
 * setEmitAdapter() instead of the standard IPlugin pattern.
 *
 * This adapter auto-configures itself when EVENT_BRIDGE_* env vars are set.
 */
import { type EmitAdapter, setEmitAdapter } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:eventbridge');

const EventBridgeEventEmitter = async ({ region, source, busName }): Promise<EmitAdapter> => {
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
  };
};

const { EVENT_BRIDGE_REGION, EVENT_BRIDGE_SOURCE, EVENT_BRIDGE_BUS_NAME } = process.env;
if (EVENT_BRIDGE_REGION && EVENT_BRIDGE_SOURCE && EVENT_BRIDGE_BUS_NAME) {
  const eventBridgeAdapter = await EventBridgeEventEmitter({
    source: EVENT_BRIDGE_SOURCE,
    region: EVENT_BRIDGE_REGION,
    busName: EVENT_BRIDGE_BUS_NAME,
  });
  setEmitAdapter(eventBridgeAdapter);
}
