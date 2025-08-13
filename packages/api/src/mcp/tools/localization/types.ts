export type LocalizationType = 'COUNTRY' | 'CURRENCY' | 'LANGUAGE';

export interface LocalizationModuleConfig {
  module: any;
  NotFoundError: any;
  entityName: string;
  idField: string;
  existsMethod: any;
  findMethod: any;
  findMultipleMethod: any;
}

export interface LocalizationEntity {
  isoCode: string;
  contractAddress?: string;
  decimals?: number;
}

export interface LocalizationUpdateEntity {
  isoCode?: string;
  contractAddress?: string;
  decimals?: number;
}

export interface LocalizationListOptions {
  limit?: number;
  offset?: number;
  includeInactive?: boolean;
  queryString?: string;
  sort?: {
    key: string;
    value: 'ASC' | 'DESC';
  }[];
}

export interface LocalizationCountOptions {
  includeInactive?: boolean;
  queryString?: string;
}
