import { EventDirector, EmitAdapter } from './EventDirector.js';

const {
  emit,
  getEmitAdapter,
  getEmitHistoryAdapter,
  getRegisteredEvents,
  registerEvents,
  setEmitAdapter,
  setEmitHistoryAdapter,
  subscribe,
} = EventDirector;

const GLOBAL_EVENTS = ['PAGE_VIEW'];
registerEvents(GLOBAL_EVENTS);

export {
  emit,
  getEmitAdapter,
  getEmitHistoryAdapter,
  getRegisteredEvents,
  registerEvents,
  setEmitAdapter,
  setEmitHistoryAdapter,
  subscribe,
  EmitAdapter,
};
