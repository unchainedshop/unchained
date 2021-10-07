import { EventEmitter } from 'events';
import EventDirector, { EventAdapter } from '../director';

class NodeEventEmitter extends EventAdapter {
  eve = new EventEmitter();

  publish(val: string, obj: any) {
    this.eve.emit(val, obj);
  }

  subscribe(str, callBack) {
    return this.eve.on(str, callBack);
  }
}

const handler = new NodeEventEmitter();

EventDirector.setEventAdapter(handler);
