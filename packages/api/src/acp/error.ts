export type ACPErrorType =
  | 'invalid_request'
  | 'authentication_error'
  | 'permission_error'
  | 'not_found_error'
  | 'conflict_error'
  | 'invalid_api_key_error'
  | 'api_error'
  | 'api_connection_error';

export class ACPError extends Error {
  status: number;
  type: ACPErrorType;
  code: string;
  param?: string;

  constructor(status: number, type: ACPErrorType, code: string, message: string, param?: string) {
    super(message);
    this.status = status;
    this.type = type;
    this.code = code;
    this.param = param;
  }

  toJSON() {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      ...(this.param ? { param: this.param } : {}),
    };
  }
}
