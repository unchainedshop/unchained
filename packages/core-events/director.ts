export abstract class EventAdapter {
  public abstract publish(eventName: string, payload: any): void;

  public abstract subscribe(eventName: string, callBack: () => void): void;
}

class EventDirector {
  private static adapter: EventAdapter;

  private static registeredEvents = new Set();

  static registerEvents(events: string[]): void {
    if (events.length) {
      events.forEach((e) => EventDirector.registeredEvents.add(e));
    }
  }

  static getRegisteredEvents(): string[] {
    return Array.from(EventDirector.registeredEvents) as string[];
  }

  static setEventAdapter(adapter: EventAdapter): void {
    EventDirector.adapter = adapter;
  }

  static emit(eventName: string, payload: any): void {
    if (!EventDirector.registeredEvents.has(eventName))
      throw new Error(`Event with ${eventName} is not registered`);
    EventDirector.adapter.publish(eventName, payload);
  }

  static subscribe(eventName: string, callBack: () => void): void {
    EventDirector.adapter.subscribe(eventName, callBack);
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
