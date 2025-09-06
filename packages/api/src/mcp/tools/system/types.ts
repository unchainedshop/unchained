import { WorkStatus } from '@unchainedshop/core-worker';
import { SortOption } from '@unchainedshop/utils';

export interface WorkListOptions {
  limit?: number;
  offset?: number;
  queryString?: string;
  status?: WorkStatus[];
  types?: string[];
  sort?: SortOption[];
  created?: {
    start?: Date;
    end?: Date;
  };
}

export interface WorkCountOptions {
  queryString?: string;
  status?: WorkStatus[];
  created?: {
    start?: Date;
    end?: Date;
  };
  types?: string[];
}

export interface EventListOptions {
  limit?: number;
  offset?: number;
  queryString?: string;
  types?: string[];
  sort?: SortOption[];
  created?: {
    start?: Date;
    end?: Date;
  };
}

export interface EventCountOptions {
  queryString?: string;
  created?: {
    start?: Date;
    end?: Date;
  };
  types?: string[];
}
