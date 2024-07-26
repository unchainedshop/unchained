/*
 * Data definitions
 */

export type Configuration = Array<{ key: string; value: string }>;

export type LogFields = {
  log: Array<{
    date: Date;
    status?: string;
    info: string;
  }>;
};

export type TimestampFields = {
  created?: Date;
  updated?: Date;
  deleted?: Date;
};

export interface Address {
  addressLine?: string;
  addressLine2?: string;
  city?: string;
  company?: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  postalCode?: string;
  regionCode?: string;
}

export interface Contact {
  telNumber?: string;
  emailAddress?: string;
}
