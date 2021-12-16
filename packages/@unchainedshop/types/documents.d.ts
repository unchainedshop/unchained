import { Context } from './api';
import { IAdapterClass, IDirectorClass } from './common';
import { Order, OrderPayment, OrderDelivery, OrderPosition } from './orders';
import { User } from './user';

export type DocumentMeta = { date?: Date; type?: string; status?: string };
export type Document = {
  file: string;
  fileName: string;
  meta: DocumentMeta;
  [x: string]: any;
};

export interface DocumentContext {
  documents: Array<Document>;
  user: User;
  order: Order;
  orderPositions: Array<OrderPosition>;
}
export type DocumentAdapterContext = DocumentContext & Context;

export interface IDocumentAdapterClass extends IAdapterClass {
  isActivatedFor: (context: DocumentAdapterContext) => Promise<boolean>;
}

export interface IDocumentAdapter {}

export interface DocumenExecuteOptions {
  date?: Date;
  payment?: OrderPayment;
  orderNumber: string;
  delivery?: OrderDelivery;
  ancestors: Array<Document>;
}

export interface IDocumentDirector {
  filteredDocuments: (params: DocumentMeta) => Array<Document>;
  isDocumentExists: (params: DocumentMeta) => boolean;
  execute: (
    name: string,
    options: DocumenExecuteOptions,
    ancestors: Array<Document>
  ) => Promise<Array<Document>>;
}
