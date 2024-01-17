import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:events');

export type RawPayloadType<T> = {
  payload: T;
  context: {
    userAgent?: string;
    language?: string;
    country?: string;
    remoteAddress?: string;
    referer?: string;
    origin?: string;
    userId?: string;
  };
};
export interface EmitAdapter {
  publish(eventName: string, data: RawPayloadType<Record<string, any>>): void;
  subscribe(eventName: string, callback: (payload: RawPayloadType<Record<string, any>>) => void): void;
}

export type ContextNormalizerFunction = (context: any) => RawPayloadType<any>['context'];

export const defaultNormalizer: ContextNormalizerFunction = (context) => {
  return {
    userAgent: context?.userAgent,
    language: context?.localeContext?.code,
    country: context?.localeContext?.country,
    remoteAddress: context?.remoteAddress,
    referer: context?.req?.headers?.referer,
    origin: context?.req?.headers?.origin,
    userId: context?.userId,
  };
};

const RegisteredEventsSet = new Set();
const RegisteredCallbacksSet = new Set();

let Adapter: EmitAdapter; // Public (customizable)
let HistoryAdapter: EmitAdapter; // (Per default: Core-events adapter to write into DB)
let ContextNormalizer = defaultNormalizer;

export const EventDirector = {
  registerEvents: (events: string[]): void => {
    if (events.length) {
      events.forEach((e) => RegisteredEventsSet.add(e));
      logger.verbose(`EventDirector -> Registered ${JSON.stringify(events)}`);
    }
  },

  getRegisteredEvents: (): string[] => {
    return Array.from(RegisteredEventsSet) as string[];
  },

  setContextNormalizer: (fn: ContextNormalizerFunction): void => {
    ContextNormalizer = fn;
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
    const extractedContext = ContextNormalizer(null);

    if (!RegisteredEventsSet.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);

    const payload = data || {};

    Adapter?.publish(eventName, {
      payload,
      context: extractedContext,
    });

    HistoryAdapter?.publish(eventName, {
      payload,
      context: extractedContext,
    });

    logger.verbose(`EventDirector -> Emitted ${eventName} with ${JSON.stringify(data)}`);
  },

  subscribe: <T>(eventName: string, callback: (payload: RawPayloadType<T>) => void): void => {
    const currentSubscription = `${eventName}${callback?.toString()}`; // used to avaoid registering the same event handler callback

    if (!RegisteredEventsSet.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);

    if (!RegisteredCallbacksSet.has(currentSubscription)) {
      Adapter?.subscribe(eventName, callback);
      HistoryAdapter?.subscribe(eventName, callback);
      RegisteredCallbacksSet.add(currentSubscription);
      logger.verbose(`EventDirector -> Subscribed to ${eventName}`);
    }
  },
};
