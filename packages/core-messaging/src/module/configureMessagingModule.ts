import mustache from 'mustache';
import { MessagingModule } from '@unchainedshop/core-messaging';
import { createLogger } from '@unchainedshop/logger';
import { ModuleInput } from '@unchainedshop/core';

export const messagingLogger = createLogger('unchained:core-messaging');

export const configureMessagingModule: (options: ModuleInput<unknown>) => MessagingModule = () => {
  return {
    renderToText(template, data) {
      try {
        const rendered = mustache.render(template, data, undefined, { escape: (t) => t }); // No escape, it's a text mail
        return rendered;
      } catch (e) {
        if (e.getMessages) {
          const warning = e.getMessages();
          if (warning) {
            messagingLogger.warn(warning);
          }
          return null;
        }
        throw e;
      }
    },
  };
};
