import { CSVRow } from '../../common/utils/csvUtils';
import { IFilterType } from '../../../gql/types';

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

const normalizeContent = (
  row: CSVRow,
  prefix = 'texts.',
): Record<string, { title?: string; subtitle?: string }> => {
  const content: Record<string, { title?: string; subtitle?: string }> = {};

  Object.entries(row).forEach(([key, value]) => {
    if (!key.startsWith(prefix)) return;
    const [, locale, field] = key.split('.');
    content[locale] = content[locale] || {};
    content[locale][field as 'title' | 'subtitle'] = value || '';
  });

  return content;
};

const normalizeOptions = (row: CSVRow) => {
  const value = row['value'];
  const content: Record<string, any> = {};
  const textPrefix = 'texts.';

  Object.entries(row).forEach(([key, value]) => {
    if (!key.startsWith(textPrefix)) return;
    const [, locale, field] = key.split('.');
    content[locale] ||= {};
    content[locale][field] = value || '';
  });

  return {
    value,
    content,
  };
};

export const validateFilter = (
  { filtersCSV, optionsCSV }: any,
  intl,
): string[] => {
  const errors: string[] = [];
  for (const filter of filtersCSV) {
    if (!filter._id)
      errors.push(
        intl.formatMessage({
          id: 'filter_import.id_missing',
          defaultMessage: 'Filter _id is required',
        }),
      );
    if (!filter.key)
      errors.push(
        intl.formatMessage({
          id: 'filter_import.key_missing',
          defaultMessage: 'Filter key is required',
        }),
      );
    if (!filter.type)
      errors.push(
        intl.formatMessage({
          id: 'filter_import.type_missing',
          defaultMessage: 'Filter type is required',
        }),
      );

    if (
      [IFilterType.SingleChoice, IFilterType.MultiChoice].includes(filter.type)
    ) {
      if (!(optionsCSV || []).find((o) => o.filterId === filter._id)) {
        errors.push(
          intl.formatMessage({
            id: 'filter_import.options_missing',
            defaultMessage:
              'Options are required for SINGLE_CHOICE or MULTI_CHOICE filters',
          }),
        );
      }
    }
  }

  return errors;
};

const buildFilterEvents = (filter: FilterPayload) => ({
  entity: 'FILTER',
  operation: 'CREATE',
  payload: {
    _id: filter['_id'],
    specification: {
      type: filter['type'] as IFilterType,
      key: filter['key'] || '',
      isActive: filter['isActive'] === 'true' || filter['isActive'] === true,
      content: normalizeContent(filter),
      options: (filter?.options ?? []).map(normalizeOptions),
      meta: {},
    },
  },
});

export const usePrepareFilterImport = () => {
  const prepareFilterImport = async ({ filtersCSV, optionsCSV }) => {
    return filtersCSV.map((filter) => {
      const options = (optionsCSV || []).filter(
        (option) => option['filterId'] === filter._id,
      );

      return buildFilterEvents({ ...filter, options });
    });
  };
  return { prepareFilterImport };
};
