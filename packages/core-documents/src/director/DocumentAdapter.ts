import { log, LogLevel } from 'meteor/unchained:logger';
import { Context } from '@unchainedshop/types/api';
import {
  DocumentAdapterContext,
  IDocumentAdapter,
  IDocumentAdapterClass,
} from '@unchainedshop/types/documents';

export class DocumentAdapter implements IDocumentAdapter {
  static key = '';
  static label = '';
  static version = '';

  static async isActivatedFor(context: DocumentAdapterContext) {
    return false;
  }

  public context: DocumentAdapterContext;

  constructor(context: DocumentAdapterContext) {
    this.context = context;
  }

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    // eslint-disable-line
    return log(message, { level, ...options });
  }
}
