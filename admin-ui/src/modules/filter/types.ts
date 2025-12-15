import { IFilterType } from '../../gql/types';

export type FilterOptionCSVRow = {
  optionId: string;
  value: string;
  filterId: string;
  [key: string]: any;
};

export type FilterCSVRow = {
  _id: string;
  key: string;
  type: IFilterType;
  isActive?: string;
  [key: string]: any;
};

export interface FilterImportPayload {
  filtersCSV: FilterCSVRow[];
  optionsCSV: FilterOptionCSVRow[];
}

export interface FilterOptionPayload {
  _id?: string;
  value: string;
  content?: Record<string, { title?: string; subtitle?: string }>;
}

export interface FilterPayload {
  _id?: string;
  type: IFilterType;
  key: string;
  isActive?: boolean | string;
  content: Record<string, { title?: string; subtitle?: string }>;
  options?: FilterOptionPayload[];
  meta?: Record<string, any>;
}

export type CSVFileKey = 'filtersCSV' | 'optionsCSV';
export interface FileConfig {
  key: CSVFileKey;
  label: string;
  optional?: boolean;
}

export type BuildFilterEventsParam = FilterCSVRow & {
  options: FilterOptionCSVRow[];
};
