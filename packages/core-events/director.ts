import { createLogger } from 'meteor/unchained:core-logger';
import { Events } from './db';

const logger = createLogger('unchained:core-events');
export abstract class EventAdapter {
  public abstract publish(eventName: string, payload: any): void;

  public abstract subscribe(eventName: string, callBack: () => void): void;
}

class EventDirector {
  private static adapter: EventAdapter;

  private static registeredEvents = new Set();

  private static registeredCallbacks = new Set();

  static registerEvents(events: string[]): void {
    if (events.length) {
      events.forEach((e) => EventDirector.registeredEvents.add(e));
      logger.info(`EventDirector -> Registered ${JSON.stringify(events)}`);
    }
  }

  static getRegisteredEvents(): string[] {
    return Array.from(EventDirector.registeredEvents) as string[];
  }

  static setEventAdapter(adapter: EventAdapter): void {
    EventDirector.adapter = adapter;
  }

  static emit(eventName: string, data: any): void {
    if (!EventDirector.registeredEvents.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);
    EventDirector.adapter.publish(eventName, { payload: { ...data } });
    Events.insert({
      type: eventName,
      payload: data,
      created: new Date(),
    });
    logger.info(
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
      logger.info(`EventDirector -> Subscribed to ${eventName}`);
    }
  }
}

export const {
  emit,
  subscribe,
  setEventAdapter,
  registerEvents,
  getRegisteredEvents,
} = EventDirector;
export default EventDirector;
