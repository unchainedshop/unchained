import { createLogger } from 'meteor/unchained:core-logger';
import { Collection } from 'unchained-core-types';
import {
  Event,
  EventAdapter,
  EventDirector as EventDirectorType,
} from 'unchained-core-types/events';

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

const RegisteredEventsSet = new Set();
const RegisteredCallbacksSet = new Set();

let Adapter: EventAdapter;
let ContextNormalizer = defaultNormalizer;
let Events: Collection<Event>;

export const EventDirector: EventDirectorType & {
  getEventAdapter: () => EventAdapter;
} = {
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

  setEventAdapter: (adapter: EventAdapter) => {
    Adapter = adapter;
  },

  getEventAdapter: (): EventAdapter => Adapter,

  emit: async (eventName: string, data: any): Promise<void> => {
    // const context = getContext();
    const extractedContext = ContextNormalizer(null);

    if (!RegisteredEventsSet.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);

    Adapter?.publish(eventName, {
      payload: { ...data },
      context: extractedContext,
    });

    if (Events) {
      await Events.insertOne({
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

    if (!RegisteredEventsSet.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);

    if (!RegisteredCallbacksSet.has(currentSubscription)) {
      Adapter?.subscribe(eventName, callBack);
      RegisteredCallbacksSet.add(currentSubscription);
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

export const configureEventDirector = (
  EventsCollection: Collection<Event>
): EventDirectorType => {
  Events = EventsCollection;

  return EventDirector;
};
