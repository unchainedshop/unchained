import { registerEvents } from '@unchainedshop/events';

export enum API_EVENTS {
  API_LOGIN_TOKEN_CREATED = 'API_LOGIN_TOKEN_CREATED',
  API_LOGOUT = 'API_LOGOUT',
}

registerEvents(Object.keys(API_EVENTS));
