export interface EventAdapter {
  publish(eventName: string, payload: any): void;
  subscribe(eventName: string, callBack: (payload?: any) => void): void;
}

let eventAdapter: EventAdapter;

export const setEventAdapter = (adapter: EventAdapter): void => {
  eventAdapter = adapter;
};

export const getEventAdapter = (): EventAdapter => eventAdapter;
