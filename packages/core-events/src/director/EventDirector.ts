import { createLogger } from 'unchained-core-logger';
import { Collection, EventDirector as EventDirectorType } from 'unchained-core-types';

const logger = createLogger('unchained:core-events');

export type ContextNormalizerFunction = (context: any) => any;

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

export interface EventAdapter {
  publish(eventName: string, payload: any): void;
  subscribe(eventName: string, callBack: (payload?: any) => void): void;
}

const _registeredEvents = new Set();
const _registeredCallbacks = new Set();

let _adapter: EventAdapter
let _contextNormalizer = defaultNormalizer;
let _Events;

export const EventDirector: EventDirectorType & { getEventAdapter: () => EventAdapter } = {
  registerEvents: (events: string[]): void => {
    if (events.length) {
      events.forEach((e) => _registeredEvents.add(e));
      logger.verbose(`EventDirector -> Registered ${JSON.stringify(events)}`);
    }
  },

  getRegisteredEvents: (): string[] => {
    return Array.from(_registeredEvents) as string[];
  },

  setContextNormalizer: (fn: ContextNormalizerFunction): void => {
    _contextNormalizer = fn;
  },

  setEventAdapter: (adapter: EventAdapter) => {
    _adapter = adapter;
  },

  getEventAdapter: (): EventAdapter => _adapter,

  emit: async (eventName: string, data: any): Promise<void> => {
    // const context = getContext();
    const extractedContext = _contextNormalizer(null);

    if (!_registeredEvents.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);

    _adapter?.publish(eventName, {
      payload: { ...data },
      context: extractedContext,
    });

    if (_Events) {
      await _Events.insert({
        type: eventName,
        payload: data,
        context: extractedContext,
        created: new Date(),
      });
    }

    logger.verbose(
      `EventDirector -> Emitted ${eventName} with ${JSON.stringify(data)}`
    );
  },

  subscribe: (eventName: string, callBack: () => void): void => {
    const currentSubscription = eventName + callBack?.toString(); // used to avaoid registering the same event handler callback

    if (!_registeredEvents.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);

    if (!_registeredCallbacks.has(currentSubscription)) {
      _adapter?.subscribe(eventName, callBack);
      _registeredCallbacks.add(currentSubscription);
      logger.verbose(`EventDirector -> Subscribed to ${eventName}`);
    }
  },
};

export const {
  emit,
  getRegisteredEvents,
  registerEvents,
  setContextNormalizer,
  setEventAdapter,
  subscribe,
} = EventDirector;

export const configureEventDirector = (Events: Collection): EventDirectorType => {
  _Events = Events;

  return EventDirector
};
