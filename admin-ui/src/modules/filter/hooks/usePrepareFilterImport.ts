import { CSVRow } from '../../common/utils/csvUtils';
import { IFilterType } from '../../../gql/types';
import { BuildFilterEventsParam, FilterImportPayload } from '../types';

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
  { filtersCSV, optionsCSV }: FilterImportPayload,
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
      filter.type &&
      ![
        IFilterType.SingleChoice,
        IFilterType.MultiChoice,
        IFilterType.Range,
        IFilterType.Switch,
      ].includes(filter.type)
    )
      errors.push(
        intl.formatMessage(
          {
            id: 'filter_csv_invalid_type_set',
            defaultMessage: 'invalid filter type {type}',
          },
          {
            type: filter.type,
          },
        ),
      );
  }

  for (const option of optionsCSV) {
    if (!option.value)
      errors.push(
        intl.formatMessage({
          id: 'filter_option_csv_value_missing',
          defaultMessage: 'Filter options value is required',
        }),
      );
    if (!option.filterId)
      errors.push(
        intl.formatMessage({
          id: 'filter_option_csv_filterId_missing',
          defaultMessage: 'Filter option filterId is required',
        }),
      );
  }

  return errors;
};

const buildFilterEvents = (filter: BuildFilterEventsParam) => ({
  entity: 'FILTER',
  operation: 'CREATE',
  payload: {
    _id: filter['_id'],
    specification: {
      type: filter['type'] as IFilterType,
      key: filter['key'] || '',
      isActive: filter['isActive'] === 'true',
      content: normalizeContent(filter),
      options: (filter?.options ?? []).map(normalizeOptions),
      meta:
        typeof filter['meta'] === 'object'
          ? JSON.parse(filter['meta'] || '{}')
          : filter['meta'],
    },
  },
});

export const usePrepareFilterImport = () => {
  const prepareFilterImport = async ({
    filtersCSV,
    optionsCSV,
  }: FilterImportPayload): Promise<any> => {
    return filtersCSV.map((filter) => {
      const options = (optionsCSV || []).filter(
        (option) => option['filterId'] === filter._id,
      );

      return buildFilterEvents({ ...filter, options });
    });
  };
  return { prepareFilterImport };
};
