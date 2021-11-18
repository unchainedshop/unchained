import { createLogger } from 'unchained-logger';
import { ContextNormalizerFunction, EmitAdapter, EventDirectorType } from './events.types';

const logger = createLogger('unchained:events');

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

let Adapter: EmitAdapter;
let HistoryAdapter: EmitAdapter;
let ContextNormalizer = defaultNormalizer;

export const EventDirector: EventDirectorType = {
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

  setEmitAdapter: (adapter: EmitAdapter) => {
    Adapter = adapter;
  },

  getEmitAdapter: (): EmitAdapter => Adapter,

  setEmitHistoryAdapter: (adapter: EmitAdapter) => {
    HistoryAdapter = adapter;
  },

  getEmitHistoryAdapter: (): EmitAdapter => HistoryAdapter,

  emit: async (eventName: string, data: any): Promise<void> => {
    // const context = getContext();
    const extractedContext = ContextNormalizer(null);

    if (!RegisteredEventsSet.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);

    Adapter?.publish(eventName, {
      payload: { ...data },
      context: extractedContext,
    });

    HistoryAdapter?.publish(eventName, {
      payload: { ...data },
      context: extractedContext,
    });

    logger.verbose(
      `EventDirector -> Emitted ${eventName} with ${JSON.stringify(data)}`
    );
  },

  subscribe: (eventName: string, callBack: () => void): void => {
    const currentSubscription = eventName + callBack?.toString(); // used to avaoid registering the same event handler callback

    if (!RegisteredEventsSet.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);

    if (!RegisteredCallbacksSet.has(currentSubscription)) {
      Adapter?.subscribe(eventName, callBack);
      HistoryAdapter?.subscribe(eventName, callBack);
      RegisteredCallbacksSet.add(currentSubscription);
      logger.verbose(`EventDirector -> Subscribed to ${eventName}`);
    }
  },
};


