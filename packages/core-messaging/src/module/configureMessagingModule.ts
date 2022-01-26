import mjml from 'mjml';
import mustache from 'mustache';
import { MessagingModule } from '@unchainedshop/types/messaging';
import { messagingLogger } from '../messaging-logger';

export const configureMessagingModule = (): MessagingModule => {
  return {
    renderToText(template, data) {
      try {
        const rendered = mustache.render(template, data);
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

    renderMjmlToHtml(template, data) {
      try {
        const rendered = mustache.render(template, data);
        const { html, errors } = mjml(rendered, { minify: true });
        if (errors && errors.length)
          messagingLogger.warn(JSON.stringify(errors));
        return html;
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
