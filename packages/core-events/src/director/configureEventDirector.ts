import { createLogger } from 'unchained-core-logger';
import { getContext } from 'unchained-utils';
import { EventDirector } from 'unchained-core-types';
import { EventAdapter, getEventAdapter, setEventAdapter } from './EventAdapter';

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

export const configureEventDirector = (Events: any): EventDirector => {
  const _registeredEvents = new Set();
  const _registeredCallbacks = new Set();

  let _contextNormalizer = defaultNormalizer;

  const EventDirector = {
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
      setEventAdapter(adapter)
    },

    emit: async (eventName: string, data: any): Promise<void> => {
      const adapter = getEventAdapter();
      const context = await getContext();
      const extractedContext = _contextNormalizer(context);

      if (!_registeredEvents.has(eventName))
        throw new Error(`Event with ${eventName} is not registered`);

      adapter.publish(eventName, {
        payload: { ...data },
        context: extractedContext,
      });

      await Events.insert({
        type: eventName,
        payload: data,
        context: extractedContext,
        created: new Date(),
      });

      logger.verbose(
        `EventDirector -> Emitted ${eventName} with ${JSON.stringify(data)}`
      );
    },

    subscribe: (eventName: string, callBack: () => void): void => {
      const adapter = getEventAdapter();

      const currentSubscription = eventName + callBack?.toString(); // used to avaoid registering the same event handler callback

      if (!_registeredEvents.has(eventName))
        throw new Error(`Event with ${eventName} is not registered`);

      if (!_registeredCallbacks.has(currentSubscription)) {
        adapter.subscribe(eventName, callBack);
        _registeredCallbacks.add(currentSubscription);
        logger.verbose(`EventDirector -> Subscribed to ${eventName}`);
      }
    },
  };

  return EventDirector;
};
