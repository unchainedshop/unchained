import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:events');

export interface RawPayloadType<T> {
  payload: T;
}
export interface EmitAdapter {
  publish(eventName: string, data: RawPayloadType<Record<string, any>>): void;
  subscribe(eventName: string, callback: (payload: RawPayloadType<Record<string, any>>) => void): void;
  // Optional teardown for adapters holding long-lived connections (redis,
  // eventbridge). Called by startPlatform on graceful shutdown.
  shutdown?(): Promise<void> | void;
}

const RegisteredEventsSet = new Set();
const RegisteredCallbacksSet = new Set();

let Adapter: EmitAdapter; // Public (customizable)
let HistoryAdapter: EmitAdapter; // (Per default: Core-events adapter to write into DB)

// Event backends use setEmitAdapter/setEmitHistoryAdapter. Core domain directors
// resolve their adapters from pluginRegistry; this infrastructure package keeps
// its emitter configuration independent of the core plugin registry.
export const EventDirector = {
  registerEvents: (events: string[]): void => {
    if (events.length) {
      events.forEach((e) => RegisteredEventsSet.add(e));
    }
  },

  getRegisteredEvents: (): string[] => {
    return Array.from(RegisteredEventsSet) as string[];
  },

  setEmitAdapter: (adapter: EmitAdapter): void => {
    Adapter = adapter;
  },

  getEmitAdapter: (): EmitAdapter => Adapter,

  setEmitHistoryAdapter: (adapter: EmitAdapter): void => {
    HistoryAdapter = adapter;
  },

  getEmitHistoryAdapter: (): EmitAdapter => HistoryAdapter,

  emit: async (eventName: string, data?: Record<string, any>): Promise<void> => {
    if (!RegisteredEventsSet.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);

    const payload = data || {};

    Adapter?.publish(eventName, {
      payload,
    });

    HistoryAdapter?.publish(eventName, {
      payload,
    });

    // Only log event name, not payload (may contain sensitive data)
    logger.debug(`EventDirector -> Emitted ${eventName}`);
  },

  subscribe: <T extends Record<string, any>>(
    eventName: string,
    callback: (payload: RawPayloadType<T>) => void,
  ): void => {
    const currentSubscription = `${eventName}${callback?.toString()}`; // Deduplicate subscriptions by event name and callback source.

    if (!RegisteredEventsSet.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);

    if (!RegisteredCallbacksSet.has(currentSubscription)) {
      Adapter?.subscribe(eventName, callback);
      HistoryAdapter?.subscribe(eventName, callback);
      RegisteredCallbacksSet.add(currentSubscription);
    }
  },
};
