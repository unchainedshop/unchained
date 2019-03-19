import { log } from 'meteor/unchained:core-logger';
import { defaultEmailResolver, defaultSMSResolver } from './template-resolvers';

const { LANG } = process.env;

const MessagingType = {
  EMAIL: 'EMAIL',
  SMS: 'SMS'
};

class MessagingAdapter {
  static key = '';

  static label = '';

  static version = '';

  static isActivatedFor() {
    return false;
  }

  constructor({ context, resolver }) {
    this.context = context;
    this.resolver = resolver;
  }

  sendMessage() { // eslint-disable-line
    return null;
  }

  log(message, { level = 'verbose', ...options } = {}) { // eslint-disable-line
    return log(message, { level, ...options });
  }
}

class MessagingDirector {
  constructor(context) {
    this.context = {
      locale: LANG,
      ...context
    };
  }

  sendMessage(options) {
    return this.execute('sendMessage', options);
  }

  execute(name, options) {
    return this.constructor
      .sortedAdapters()
      .filter(AdapterClass => {
        const activated = AdapterClass.isActivatedFor(this.context);
        if (!activated) {
          log(
            `${this.constructor.name} -> ${AdapterClass.key} (${
              AdapterClass.version
            }) skipped`,
            {
              level: 'warn'
            }
          );
        }
        return activated;
      })
      .map(AdapterClass => {
        const concreteAdapter = new AdapterClass({
          context: this.context,
          resolver: this.constructor.resolvers.get(this.context.type)
        });
        log(
          `${this.constructor.name} -> via ${
            AdapterClass.key
          } -> Execute '${name}'`
        );
        return concreteAdapter[name](options);
      }, []);
  }

  static adapters = new Map();

  static resolvers = new Map();

  static sortedAdapters() {
    return Array.from(this.adapters)
      .map(entry => entry[1])
      .sort(entry => entry.key);
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${
        adapter.label
      })`
    );
    this.adapters.set(adapter.key, adapter);
  }

  static setTemplateResolver(type, resolver) {
    log(`${this.name} -> Registered custom template resolver for ${type}`);
    this.resolvers.set(type, resolver);
  }
}

MessagingDirector.setTemplateResolver(
  MessagingType.EMAIL,
  defaultEmailResolver
);
MessagingDirector.setTemplateResolver(MessagingType.SMS, defaultSMSResolver);

export { MessagingType, MessagingDirector, MessagingAdapter };
