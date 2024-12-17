import { EmitAdapter, setEmitAdapter } from '@unchainedshop/events';
import { EventBridgeClient, PutEventsCommand, PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:eventbridge');

const EventBridgeEventEmitter = ({ region, source, busName }): EmitAdapter => {
  const ebClient = new EventBridgeClient({ region });

  return {
    publish: (eventName, payload) => {
      const entry: PutEventsRequestEntry = {
        Source: source,
        DetailType: eventName,
        EventBusName: busName,
        Detail: JSON.stringify(payload),
      };
      ebClient
        .send(
          new PutEventsCommand({
            Entries: [entry],
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
  setEmitAdapter(
    EventBridgeEventEmitter({
      source: EVENT_BRIDGE_SOURCE,
      region: EVENT_BRIDGE_REGION,
      busName: EVENT_BRIDGE_BUS_NAME,
    }),
  );
}
