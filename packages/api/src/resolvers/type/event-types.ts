import { Context } from '@unchainedshop/types/api.js';
import type { Event as EventType } from '@unchainedshop/core-events';

export type HelperType<P, T> = (work: EventType, params: P, context: Context) => T;

export interface EventHelperTypes {
  type: HelperType<never, string>;
}

export const Event: EventHelperTypes = {
  type: (obj, _, { modules }) => {
    return modules.events.type(obj);
  },
};
