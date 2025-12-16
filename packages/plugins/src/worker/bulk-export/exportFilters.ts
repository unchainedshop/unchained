import type { UnchainedCore } from '@unchainedshop/core';
import generateCSVFileAndURL from './generateCSVFileAndUrl.ts';

const FILTER_CSV_SCHEMA = {
    filterFields: ['_id', 'key', 'type', 'isActive'],
    optionFields: ['optionId', 'filterId', 'value'],
    textFields: ['title', 'subtitle'],
};

const buildFilterHeaders = (locales: string[]) => [
    ...FILTER_CSV_SCHEMA.filterFields,
    ...locales.flatMap((locale) =>
        FILTER_CSV_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
    ),
];

const buildOptionHeaders = (locales: string[]) => [
    ...FILTER_CSV_SCHEMA.optionFields,
    ...locales.flatMap((locale) =>
        FILTER_CSV_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
    ),
];
const fetchTexts = async (
    modules: UnchainedCore['modules'],
    filterId: string,
    filterOptionValue?: string,
) => {
    const texts = await modules.filters.texts.findTexts({ filterId, filterOptionValue });
    return texts.reduce((acc, t) => ({ ...acc, [t.locale]: t }), {} as Record<string, any>);
};

const exportFilters = async (params: any, locales: string[], unchainedAPI: UnchainedCore) => {
    const { modules } = unchainedAPI;
    const filters = await modules.filters.findFilters({ ...params });

    const filterRows: Record<string, any>[] = [];
    const optionRows: Record<string, any>[] = [];

    for (const filter of filters) {
        const filterTexts = await fetchTexts(modules, filter._id);
        const row: Record<string, any> = {
            _id: filter._id,
            key: filter.key,
            type: filter.type,
            isActive: filter.isActive,
        };
        locales.forEach((locale) => {
            const t = filterTexts[locale] || {};
            FILTER_CSV_SCHEMA.textFields.forEach((field) => {
                row[`texts.${locale}.${field}`] = t[field] ?? '';
            });
        });
        filterRows.push(row);
        for (const optionValue of filter.options || []) {
            const optionTexts = await fetchTexts(modules, filter._id, optionValue);
            const optionRow: Record<string, any> = {
                optionId: `${filter._id}:${optionValue}`,
                filterId: filter._id,
                value: optionValue,
            };
            locales.forEach((locale) => {
                const t = optionTexts[locale] || {};
                FILTER_CSV_SCHEMA.textFields.forEach((field) => {
                    optionRow[`texts.${locale}.${field}`] = t[field] ?? '';
                });
            });
            optionRows.push(optionRow);
        }
    }

    return {
        filters: await generateCSVFileAndURL({
            headers: buildFilterHeaders(locales),
            rows: filterRows,
            directoryName: 'exports',
            fileName: 'filters_export.csv',
            unchainedAPI,
        }),
        filterOptions: await generateCSVFileAndURL({
            headers: buildOptionHeaders(locales),
            rows: optionRows,
            directoryName: 'exports',
            fileName: 'filters_options_export.csv',
            unchainedAPI,
        }),
    };
};

export default exportFilters;
