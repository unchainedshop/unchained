import { createLogger } from 'unchained-logger';
import mjml from 'mjml';
import mustache from 'mustache';

const logger = createLogger('unchained:core-messaging');

class MessagingDirector {
  static renderToText(template, data) {
    try {
      const rendered = mustache.render(template, data);
      return rendered;
    } catch (e) {
      if (e.getMessages) {
        const warning = e.getMessages();
        if (warning) {
          logger.warn(warning);
        }
        return null;
      }
      throw e;
    }
  }

  static renderMjmlToHtml(template, data) {
    try {
      const rendered = mustache.render(template, data);
      const { html, errors } = mjml(rendered, { minify: true });
      if (errors && errors.length) logger.warn(JSON.stringify(errors));
      return html;
    } catch (e) {
      if (e.getMessages) {
        const warning = e.getMessages();
        if (warning) {
          logger.warn(warning);
        }
        return null;
      }
      throw e;
    }
  }

  static resolvers = new Map();

  static configureTemplate(template, resolver) {
    logger.info(
      `${this.name} -> Registered custom template resolver for ${template}`
    );
    this.resolvers.set(template, resolver);
  }
}

export default MessagingDirector;

export { MessagingDirector };
