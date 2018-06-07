import { log } from 'meteor/unchained:core-logger';

class DocumentAdapter {
  static key = ''
  static label = ''
  static version = ''

  static isActivatedFor() {
    return false;
  }

  constructor(context) {
    this.context = context;
  }

  log(message) { // eslint-disable-line
    return log(message);
  }
}

class DocumentDirector {
  constructor(context) {
    this.context = context;
    this.adapters = DocumentDirector.sortedAdapters()
      .filter(((AdapterClass) => {
        const activated = AdapterClass.isActivatedFor(this.context);
        if (!activated) log(`DocumentDirector -> ${AdapterClass.key} (${AdapterClass.version}) skipped`); // eslint-disable-line
        return activated;
      }))
      .map(AdapterClass => new AdapterClass(this.context));
  }

  filteredDocuments({ date, type, status } = {}) {
    if (!this.context.documents) return [];
    console.log(date, type, status)
    return this.context.documents.filter((doc) => {
      console.log(doc.name, doc.meta, doc._id)
      const sameType = (!type || doc.meta.type === type);
      const sameDate = (!date || new Date(doc.meta.date).getTime() === new Date(date).getTime());
      const sameStatus = (!status || doc.meta.status === status);
      console.log(sameType, sameDate, sameStatus)
      if (sameType && sameDate && sameStatus) return true;
      return false;
    });
  }

  isDocumentExists(options) {
    if (!this.context.documents) return false;
    if (this.filteredDocuments(options).length === 0) return false;
    return true;
  }

  execute(name, options, ancestors) {
    return this.adapters.map((adapter) => {
      log(`DocumentDirector via ${adapter.constructor.key} -> Execute '${name}'`);
      return adapter[name]({
        ancestors,
        ...options,
      });
    });
  }

  static adapters = new Map();
  static sortedAdapters() {
    return Array.from(DocumentDirector.adapters)
      .map(entry => entry[1])
      .sort(entry => entry.key);
  }
  static registerAdapter(adapter) {
    log(`${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`);
    DocumentDirector.adapters.set(adapter.key, adapter);
  }
}

export {
  DocumentDirector,
  DocumentAdapter,
};
