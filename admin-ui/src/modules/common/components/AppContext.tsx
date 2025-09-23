import React, { createContext, useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useLanguages from '../../language/hooks/useLanguages';
import useCountries from '../../country/hooks/useCountries';
import useShopInfo from '../hooks/useShopInfo';
import useLocalStorage from '../hooks/useLocalStorage';
import { IShopInfoQuery } from '../../../gql/types';

const isSupportedLocale = (locale) => {
  try {
    const dtf = new Intl.DateTimeFormat(locale);
    const resolved = dtf.resolvedOptions().locale;
    return resolved.toLowerCase() === locale.toLowerCase();
  } catch (e) {
    return false;
  }
};

type AppContextProps = IShopInfoQuery & {
  selectedLocale: string;
  isSystemReady: boolean;
  setSelectedLocale: (locale: string) => void;
  languageDialectList: { _id: string; isoCode: string }[];
};

const AppContext = createContext<AppContextProps | undefined>(undefined);
const createLanguageDialectList = (languages, countries) => {
  const result = [];

  languages.forEach(({ _id: languageId, isoCode: baseIsoCode }) => {
    result.push({ _id: languageId, isoCode: baseIsoCode });
    countries.forEach(({ isoCode: countryIsoCode, _id: countryId }) => {
      const dialectIsoCode = [baseIsoCode, countryIsoCode.toUpperCase()].join(
        '-',
      );
      if (isSupportedLocale(dialectIsoCode))
        result.push({
          _id: `${countryId}-${languageId}`,
          isoCode: dialectIsoCode,
        });
    });
  });

  return result;
};

export const AppContextWrapper = ({
  children,
  onlyFull = false,
}: {
  children: React.ReactNode;
  onlyFull?: boolean;
}) => {
  const { languages } = useLanguages();
  const { locale } = useIntl();
  const [storedLocale, setStoredLocale] = useLocalStorage(
    'selectedLocale',
    null,
  );
  const { shopInfo, loading: shopInfoLoading } = useShopInfo();
  const { countries } = useCountries();

  const [selectedLocale, setSelectedLocale] = useState<string>(locale);
  const setSelectedLocaleWrapper = (newLocale: string) => {
    setStoredLocale(newLocale);
    setSelectedLocale(newLocale);
  };

  useEffect(() => {
    if (storedLocale) {
      setSelectedLocale(storedLocale);

      return;
    }
    if (!shopInfoLoading) {
      const baseLanguage = `${shopInfo?.language?.isoCode}-${shopInfo?.country?.isoCode?.toUpperCase()}`;
      setSelectedLocaleWrapper(baseLanguage);
    }
  }, [shopInfo, shopInfoLoading, locale]);

  const languageDialectList = createLanguageDialectList(
    languages,
    countries,
  ).filter((l) => !onlyFull || l.isoCode.includes('-'));
  const isSystemReady = !!shopInfo?.language && !!shopInfo?.country;

  return (
    <AppContext.Provider
      value={{
        selectedLocale,
        setSelectedLocale: setSelectedLocaleWrapper,
        languageDialectList,
        isSystemReady,
        shopInfo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
