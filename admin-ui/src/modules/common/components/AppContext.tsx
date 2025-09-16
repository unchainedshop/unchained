import React, { createContext, useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useLanguages from '../../language/hooks/useLanguages';
import useCountries from '../../country/hooks/useCountries';
import useShopInfo from '../hooks/useShopInfo';

interface AppContextProps {
  selectedLocale: string;
  isSystemReady: boolean;
  setSelectedLocale: (locale: string) => void;
  languageDialectList: { _id: string; isoCode: string }[];
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const createLanguageDialectList = (languages, countries) => {
  const result = [];

  languages.forEach(({ _id: languageId, isoCode: baseIsoCode }) => {
    result.push({ _id: languageId, isoCode: baseIsoCode });
    countries.forEach(({ isoCode: countryIsoCode, _id: countryId }) => {
      const dialectIsoCode = `${baseIsoCode}-${countryIsoCode.toUpperCase()}`;
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
  const { shopInfo, loading: shopInfoLoading } = useShopInfo();
  const { countries } = useCountries();
  const { locale } = useIntl();

  const [selectedLocale, setSelectedLocale] = useState<string>(locale);

  useEffect(() => {
    if (!shopInfoLoading) {
      const baseLanguage = `${shopInfo?.language?.isoCode}-${shopInfo?.country?.isoCode?.toUpperCase()}`;
      setSelectedLocale(baseLanguage);
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
        setSelectedLocale,
        languageDialectList,
        isSystemReady,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
