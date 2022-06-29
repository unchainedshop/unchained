export interface Response {
  ResponseHeader: {
    RequestId: string;
    SpecVersion: string;
  };
  ErrorName?: string;
  ErrorMessage?: string;
  Behavior?: 'ABORT' | 'OTHER_MEANS' | 'RETRY' | 'RETRY_LATER';
}
