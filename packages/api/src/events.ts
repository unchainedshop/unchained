export const API_EVENTS = {
  API_LOGIN_TOKEN_CREATED: 'API_LOGIN_TOKEN_CREATED',
  API_LOGOUT: 'API_LOGOUT',
} as const;

export type API_EVENTS = (typeof API_EVENTS)[keyof typeof API_EVENTS];
