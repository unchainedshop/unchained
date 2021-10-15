import { createLogger } from 'meteor/unchained:core-logger';
import { Events } from './db';

const logger = createLogger('unchained:core-events');
export abstract class EventAdapter {
  public abstract publish(eventName: string, payload: any): void;

  public abstract subscribe(eventName: string, callBack: () => void): void;
}

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

class EventDirector {
  private static adapter: EventAdapter;

  private static registeredEvents = new Set();

  private static registeredCallbacks = new Set();

  private static contextNormalizer: ContextNormalizerFunction =
    defaultNormalizer;

  static registerEvents(events: string[]): void {
    if (events.length) {
      events.forEach((e) => EventDirector.registeredEvents.add(e));
      logger.verbose(`EventDirector -> Registered ${JSON.stringify(events)}`);
    }
  }

  static getRegisteredEvents(): string[] {
    return Array.from(EventDirector.registeredEvents) as string[];
  }

  static setEventAdapter(adapter: EventAdapter): void {
    EventDirector.adapter = adapter;
  }

  static setContextNormalizer(fn: ContextNormalizerFunction): void {
    EventDirector.contextNormalizer = fn;
  }

  static async emit(eventName: string, data: any): Promise<void> {
    // const context = await getContext();
    const extractedContext = EventDirector.contextNormalizer(null);
    if (!EventDirector.registeredEvents.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);
    EventDirector.adapter.publish(eventName, {
      payload: { ...data },
      context: extractedContext,
    });
    Events.insert({
      type: eventName,
      payload: data,
      context: extractedContext,
      created: new Date(),
    });
    logger.verbose(
      `EventDirector -> Emitted ${eventName} with ${JSON.stringify(data)}`
    );
  }

  static subscribe(eventName: string, callBack: () => void): void {
    const currentSubscription = eventName + callBack?.toString(); // used to avaoid registering the same event handler callback
    if (!EventDirector.registeredEvents.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);
    if (!EventDirector.registeredCallbacks.has(currentSubscription)) {
      EventDirector.adapter.subscribe(eventName, callBack);
      EventDirector.registeredCallbacks.add(currentSubscription);
      logger.verbose(`EventDirector -> Subscribed to ${eventName}`);
    }
  }
}

export const {
  emit,
  subscribe,
  setEventAdapter,
  registerEvents,
  getRegisteredEvents,
  setContextNormalizer,
} = EventDirector;
export default EventDirector;
