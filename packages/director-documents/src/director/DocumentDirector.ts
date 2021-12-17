import {
  DocumenExecuteOptions,
  Document,
  DocumentMeta,
  IDocumentDirector,
} from '@unchainedshop/types/documents';
import { log } from 'meteor/unchained:logger';
import { DocumentAdapter } from './DocumentAdapter';

export class DocumentDirector implements IDocumentDirector {
  private context;
  private adapters;

  constructor(context) {
    this.context = context;
    this.adapters = DocumentDirector.getAdapters()
      .filter((Adapter) => {
        const activated = Adapter.isActivatedFor(this.context);

        if (!activated)
          log(
            `DocumentDirector -> ${Adapter.key} (${Adapter.version}) skipped`
          );

        return activated;
      })
      .map((Adapter) => new Adapter(this.context));
  }

  filteredDocuments(params: DocumentMeta = {}) {
    if (!this.context.documents) return [];
    return this.context.documents.filter((doc) => {
      const sameType = !params.type || doc.meta.type === params.type;
      const sameDate =
        !params.date ||
        new Date(doc.meta.date).getTime() === new Date(params.date).getTime();
      const sameStatus = !params.status || doc.meta.status === params.status;
      if (sameType && sameDate && sameStatus) return true;
      return false;
    });
  }

  isDocumentExists(params: DocumentMeta) {
    if (!this.context.documents) return false;
    if (this.filteredDocuments(params).length === 0) return false;
    return true;
  }

  async execute(
    name: string,
    options: DocumenExecuteOptions,
    ancestors: Array<Document>
  ) {
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

  static Adapters = new Map<string, typeof DocumentAdapter>();

  static getAdapters(): Array<typeof DocumentAdapter> {
    return Array.from(DocumentDirector.Adapters.values()).sort((left, right) =>
      left.key.localeCompare(right.key)
    );
  }

  static getAdapter(key: string) {
    return DocumentDirector.Adapters.get(key);
  }

  static registerAdapter(Adapter: typeof DocumentAdapter) {
    log(
      `${this.name} -> Registered ${Adapter.key} ${Adapter.version} (${Adapter.label})`
    );
    DocumentDirector.Adapters.set(Adapter.key, Adapter);
  }
}
