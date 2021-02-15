// Write your package code here!

// Variables exported by this module can be imported by other packages and
// applications. See core-events-tests.js for an example of importing.
import { EventEmitter } from 'events';

const name = 'core-events';

const emitter = new EventEmitter();

export const emit = (eve, val) => {
  return emitter.emit(eve, val);
};

export const subscribe = (eve, callBack) => {
  return emitter.on(eve, callBack);
};
export const subscribeOnce = (eve, callBack) => {
  return emitter.on(eve, callBack);
};

export default name;
