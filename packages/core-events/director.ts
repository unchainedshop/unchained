import EventEmitter from 'events';

export abstract class EventAdapter {
  public abstract publish(eventName: string, payload: any): void;

  public abstract subscribe(eventName: string, callBack: () => void): void;
}

class EventDirector {
  private static adapter: EventAdapter;

  static setEventAdapter(adapter: EventAdapter): void {
    EventDirector.adapter = adapter;
  }

  static emit(eventName: string, payload: any): void {
    EventDirector.adapter.publish(eventName, payload);
  }

  static subscribe(eventName: string, callBack: () => void): void {
    EventDirector.adapter.subscribe(eventName, callBack);
  }
}

class EventPlugins extends EventAdapter {
  eve = new EventEmitter();

  publish(val: string, obj: any) {
    this.eve.emit(val, obj);
  }

  subscribe(str, callBack) {
    return this.eve.once(str, callBack);
  }
}

const handler = new EventPlugins();
EventDirector.setEventAdapter(handler);

export const { emit, subscribe, setEventAdapter } = EventDirector;
export default EventDirector;
