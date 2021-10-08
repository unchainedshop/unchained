export interface EventAdapter {
    publish(eventName: string, payload: any): void;
    subscribe(eventName: string, callBack: (payload?: any) => void): void;
}
export declare const setEventAdapter: (adapter: EventAdapter) => void;
export declare const getEventAdapter: () => EventAdapter;
