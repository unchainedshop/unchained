import { useContext } from 'react';
import { ISortOptionInput } from '../../../gql/types';
import AppContext from '../components/AppContext';

const useFormatPrice = () => {
  const currencies = useContext(AppContext)?.currencies;
  const formatPrice = (price: { currencyCode: string; amount: number }) => {
    if (!price?.currencyCode) return 'n/a';
    if (price?.amount === undefined || price?.amount === null) return '';
    const { amount, currencyCode } = price;
    const decimals =
      currencies?.find(({ isoCode }) => isoCode === currencyCode)?.decimals ??
      2;
    const value = amount / 10 ** decimals;
    const digits = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    };
    try {
      return new Intl.NumberFormat(navigator.language, {
        style: 'currency',
        currency: currencyCode,
        ...digits,
      }).format(value);
    } catch {
      return `${currencyCode} ${new Intl.NumberFormat(navigator.language, digits).format(value)}`;
    }
  };

  return { formatPrice };
};

const getInterfaceLabel = (obj: { label?: string; version?: string }) => {
  return obj?.label && obj?.version ? `${obj.label} ${obj.version}` : '';
};

const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

const normalizeCountryISOCode = (locale, isoCode, showIso = true) => {
  if (!isoCode) return '';

  try {
    return `${new Intl.DisplayNames([locale], { type: 'region' }).of(
      isoCode,
    )} ${showIso ? `(${isoCode})` : ''}`;
  } catch {
    return isoCode;
  }
};

const normalizeLanguageISOCode = (locale, isoCode, showIso = true) => {
  if (!isoCode) return '';
  try {
    return `${new Intl.DisplayNames([locale], { type: 'language' }).of(
      isoCode,
    )} ${showIso ? `(${isoCode})` : ''}`;
  } catch {
    return isoCode;
  }
};

const normalizeCurrencyISOCode = (locale, isoCode, showIso = true) => {
  if (!isoCode) return '';
  try {
    return `${new Intl.DisplayNames([locale], { type: 'currency' }).of(
      isoCode,
    )} ${showIso ? `(${isoCode})` : ''}`;
  } catch {
    return isoCode;
  }
};

const getSortKeys = (sort) => {
  return (
    (sort &&
      sort?.split(',').reduce((acc, curr) => {
        const [key = null, value = null] = (curr || '')?.split('_') || [];
        return {
          ...acc,
          [key]: value,
        };
      }, null)) ||
    {}
  );
};
export const convertSortFieldsToQueryFormat = (sort): ISortOptionInput[] => {
  return Object.entries(getSortKeys(sort))?.map(([key, value]) => ({
    key,
    value,
  })) as ISortOptionInput[];
};

const normalizeObjectToString = (object: Object) => {
  return Object.keys(object)
    ?.map((key) => [key, object[key]].join('='))
    ?.join('&');
};

const normalizeQuery = (
  oldQuery: Object,
  newState?: any,
  keyLabel?: string,
) => {
  const newQuery = keyLabel ? { ...oldQuery, [keyLabel]: newState } : oldQuery;
  return normalizeObjectToString(newQuery);
};

const getContent = (content) => {
  const span = document.createElement('span');
  span.innerHTML = content;
  return span.textContent || span.innerText;
};

export {
  useFormatPrice,
  getInterfaceLabel,
  classNames,
  normalizeCurrencyISOCode,
  normalizeCountryISOCode,
  normalizeLanguageISOCode,
  getSortKeys,
  normalizeQuery,
  getContent,
};
