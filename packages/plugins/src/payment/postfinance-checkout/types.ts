export enum IntegrationModes {
  PaymentPage = 'PaymentPage',
  Lightbox = 'Lightbox',
  iFrame = 'iFrame',
}

export enum CompletionModes {
  Immediate = 'Immediate',
  Deferred = 'Deferred',
}

export interface SignResponse {
  transactionId: number;
  location: string | null;
}

export type listenerEntityTechnicalNames = 'TransactionCompletion';

export interface WebhookData {
  eventId: number;
  entityId: number;
  listenerEntityId: number;
  listenerEntityTechnicalName: listenerEntityTechnicalNames;
  spaceId: number;
  webhookListenerId: number;
  timestamp: string; // "YYYY-MM-DDTHH:MM:ss+0000", e.g. "2022-02-18T12:40:42+0000"
}
