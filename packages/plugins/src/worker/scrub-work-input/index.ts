import { type IPlugin } from '@unchainedshop/core';
import {
  ScrubWorkInputWorker,
  configureScrubWorkInputAutoscheduling,
  type ScrubWorkInputOptions,
} from './adapter.ts';

// Opt-in, not part of a preset: removes the personal data in the input of sent mails and messages
export const createScrubWorkInputPlugin = (options: ScrubWorkInputOptions = {}): IPlugin => ({
  key: 'shop.unchained.worker-plugin.scrub-work-input',
  label: 'Scrub Work Input Worker Plugin',
  version: '1.0.0',

  adapters: [ScrubWorkInputWorker],

  onRegister: () => {
    configureScrubWorkInputAutoscheduling(options);
  },
});

export const ScrubWorkInputPlugin = createScrubWorkInputPlugin();

export default ScrubWorkInputPlugin;

// Helpers
export {
  configureScrubWorkInputAutoscheduling,
  defaultScrubbedWorkTypes,
  type ScrubWorkInputOptions,
} from './adapter.ts';
