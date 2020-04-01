import { log } from 'meteor/unchained:core-logger';

class DocumentAdapter {
  static key = '';

  static label = '';

  static version = '';

  static isActivatedFor() {
    return false;
  }

  constructor(context) {
    this.context = context;
  }

  log(message, { level = 'debug', ...options } = {}) { // eslint-disable-line
    return log(message, { level, ...options });
  }
}

class DocumentDirector {
  constructor(context) {
    this.context = context;
    this.adapters = DocumentDirector.sortedAdapters()
      .filter((AdapterClass) => {
        const activated = AdapterClass.isActivatedFor(this.context);
        if (!activated) log(`DocumentDirector -> ${AdapterClass.key} (${AdapterClass.version}) skipped`); // eslint-disable-line
        return activated;
      })
      .map((AdapterClass) => new AdapterClass(this.context));
  }

  filteredDocuments({ date, type, status } = {}) {
    if (!this.context.documents) return [];
    return this.context.documents.filter((doc) => {
      const sameType = !type || doc.meta.type === type;
      const sameDate =
        !date || new Date(doc.meta.date).getTime() === new Date(date).getTime();
      const sameStatus = !status || doc.meta.status === status;
      if (sameType && sameDate && sameStatus) return true;
      return false;
    });
  }

  isDocumentExists(options) {
    if (!this.context.documents) return false;
    if (this.filteredDocuments(options).length === 0) return false;
    return true;
  }

  async execute(name, options, ancestors) {
    return Promise.all(
      this.adapters.map(async (adapter) => {
        log(
          `DocumentDirector via ${adapter.constructor.key} -> Execute '${name}'`
        );
        if (!adapter[name])
          throw new Error(
            `Document Adapter ${adapter.constructor.key} misses ${name}`
          );
        return adapter[name]({
          ancestors,
          ...options,
        });
      })
    );
  }

  static adapters = new Map();

  static sortedAdapters() {
    return Array.from(DocumentDirector.adapters)
      .map((entry) => entry[1])
      .sort((left, right) => left.key - right.key);
  }

  static registerAdapter(adapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    DocumentDirector.adapters.set(adapter.key, adapter);
  }
}

export { DocumentDirector, DocumentAdapter };
