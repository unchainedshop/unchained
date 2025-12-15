export type AssortmentLinkCSVRow = {
  _id: string;
  childAssortmentId: string;
  sortKey?: string;
  assortmentId: string;
  tags?: string;
};

export type AssortmentProductCSVRow = {
  _id: string;
  productId: string;
  sortKey?: string;
  assortmentId: string;
  tags?: string;
};
export type AssortmentFilterCSVRow = {
  _id: string;
  filterId: string;
  sortKey?: string;
  assortmentId: string;
  tags?: string;
};

export type AssortmentCSVRow = {
  _id: string;
  isActive: string | boolean;
  isBase?: string | boolean;
  isRoot?: string | boolean;
  sequence: string | number;
  tags?: string;
  [key: string]: any;
};

export interface AssortmentImportPayload {
  assortmentCSV: AssortmentCSVRow[];
  assortmentProductsCSV: AssortmentProductCSVRow[];
  assortmentChildrenCSV: AssortmentLinkCSVRow[];
  assortmentFiltersCSV: AssortmentFilterCSVRow[];
}

export interface AssortmentPayload {
  _id: string;
  isActive: string | boolean;
  isBase?: string | boolean;
  isRoot?: string | boolean;
  sequence: string | number;
  tags?: string;
  children: AssortmentLinkCSVRow[];
  products: AssortmentProductCSVRow[];
  filters: AssortmentFilterCSVRow[];
  [key: string]: any;
}

export type AssortmentCSVFileKey =
  | 'assortmentCSV'
  | 'assortmentProductsCSV'
  | 'assortmentChildrenCSV'
  | 'assortmentFiltersCSV';
export interface FileConfig {
  key: AssortmentCSVFileKey;
  label: string;
  optional?: boolean;
}

export type BuildAssortmentEventsParam = AssortmentCSVRow & {
  children: AssortmentLinkCSVRow[];
  products: AssortmentProductCSVRow[];
  filters: AssortmentFilterCSVRow[];
};
