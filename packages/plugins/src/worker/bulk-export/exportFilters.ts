import type { UnchainedCore } from "@unchainedshop/core";
import toCSV from "./toCSV.ts";

const FILTER_CSV_SCHEMA = {
    filterFields: ['_id', 'key', 'type', 'isActive'],
    optionFields: ['optionId', 'filterId', 'value'],
    textFields: ['title', 'subtitle'],
};

const buildFilterHeaders = (locales: string[]) => [
    ...FILTER_CSV_SCHEMA.filterFields,
    ...locales.flatMap((l) =>
        FILTER_CSV_SCHEMA.textFields.map((f) => `texts.${l}.${f}`),
    ),
];

const buildFilterOptionHeaders = (locales: string[]) => [
    ...FILTER_CSV_SCHEMA.optionFields,
    ...locales.flatMap((l) =>
        FILTER_CSV_SCHEMA.textFields.map((f) => `texts.${l}.${f}`),
    ),
];

const buildFilterRows = (filters: any[], translations: any, locales: string[]) =>
    filters.map((f) => {
        const row: any = {
            _id: f._id,
            key: f.key,
            type: f.type,
            isActive: f.isActive,
        };
        locales.forEach((l) => {
            const t = translations.filters?.[f._id]?.[l] ?? {};
            FILTER_CSV_SCHEMA.textFields.forEach((field) => {
                row[`texts.${l}.${field}`] = t[field] ?? '';
            });
        });
        return row;
    });

const buildOptionRows = (filters: any[], translations: any, locales: string[]) => {
    const rows: any[] = [];
    filters.forEach((f) => {
        (f.options || []).forEach((opt: any) => {
            const row: any = {
                optionId: opt._id,
                filterId: f._id,
                value: opt.value,
            };
            locales.forEach((l) => {
                const t = translations.options?.[opt._id]?.[l] ?? {};
                FILTER_CSV_SCHEMA.textFields.forEach((field) => {
                    row[`texts.${l}.${field}`] = t[field] ?? '';
                });
            });
            rows.push(row);
        });
    });
    return rows;
};

const exportFilters = async (params: any, api: UnchainedCore) => {
    const filters = await api.modules.filters.findFilters({});
    const translations = await api.modules.filters.texts.fetchAll();

    const locales = Array.from(
        new Set(Object.values(filters).flatMap((f: any) =>
            Object.keys(translations.filters?.[f._id] || {}),
        )),
    );

    const filterRows = buildFilterRows(filters, translations, locales);
    const optionRows = buildOptionRows(filters, translations, locales);

    return {
        filters: toCSV(buildFilterHeaders(locales), filterRows),
        options: toCSV(buildFilterOptionHeaders(locales), optionRows),
    };
};

export default exportFilters;
