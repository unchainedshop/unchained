export interface RequestHeader {
  SpecVersion: string;
  CustomerId: string;
  RequestId: string;
  RetryIndicator: number;
  ClientInfo?: {
    ShopInfo?: string;
    OsInfo?: string;
  };
}

export interface Request {
  RequestHeader: RequestHeader;
}
