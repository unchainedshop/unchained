import { log } from 'meteor/unchained:core-logger';

const {
  LANG,
} = process.env;

const MessagingType = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
};

class MessagingAdapter {
  static key = ''
  static label = ''
  static version = ''

  static isActivatedFor() {
    return false;
  }

  constructor({ context }) {
    this.context = context;
  }

  sendMessage() { // eslint-disable-line
    return null;
  }

  log(message) { // eslint-disable-line
    return log(message);
  }
}

class MessagingDirector {
  constructor(context) {
    this.context = {
      locale: LANG,
      ...context,
    };
  }

  sendMessage(options) {
    return this.execute('sendMessage', options);
  }

  execute(name, options) {
    return MessagingDirector.sortedAdapters()
      .filter(((AdapterClass) => {
        const activated = AdapterClass.isActivatedFor(this.context);
        if (!activated) {
          log(`MessagingDirector -> ${AdapterClass.key} (${AdapterClass.version}) skipped`, {
            level: 'warn',
          });
        }
        return activated;
      }))
      .map((AdapterClass) => {
        const concreteAdapter = new AdapterClass({ context: this.context });
        log(`MessagingDirector via ${AdapterClass.key} -> Execute '${name}'`);
        return concreteAdapter[name](options);
      }, []);
  }

  static adapters = new Map();
  static sortedAdapters() {
    return Array.from(MessagingDirector.adapters)
      .map(entry => entry[1])
      .sort(entry => entry.key);
  }
  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`);
    MessagingDirector.adapters.set(adapter.key, adapter);
  }
}

export {
  MessagingType,
  MessagingDirector,
  MessagingAdapter,
};
