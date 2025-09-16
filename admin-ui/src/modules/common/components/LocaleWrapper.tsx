import React, { useContext } from 'react';

import { useIntl } from 'react-intl';

import { FormWrapperContext } from './FormWrapper';
import useApp from '../hooks/useApp';

const LocaleWrapper = ({ children, onlyFull = false }) => {
  const { languageDialectList, selectedLocale, setSelectedLocale } = useApp();

  const { locale } = useIntl();
  const isInsideFormWrapper = useContext(FormWrapperContext);

  const displayedLanguages = languageDialectList.filter(
    (l) => !onlyFull || l.isoCode.includes('-'),
  );

  return (
    <>
      <div className={`w-fit mt-5 mb-3 ${isInsideFormWrapper ? 'ml-5' : ''}`}>
        <select
          id="locale-wrapper"
          className="cursor-pointer rounded-md border-1 border-slate-300 dark:border-slate-700 py-1 pr-8 text-sm lg:py-1 lg:pr-10 text-black dark:text-white dark:bg-slate-800 shadow-xs  focus:outline-hidden focus:ring-2 focus:ring-slate-800"
          value={selectedLocale || ''}
          onChange={(e) => {
            e.stopPropagation();
            setSelectedLocale(e.target.value);
          }}
        >
          {displayedLanguages?.map((language) => {
            return (
              <option key={language._id} value={language.isoCode}>
                {language.isoCode}
              </option>
            );
          })}
        </select>
      </div>
      <div>{React.cloneElement(children)}</div>
    </>
  );
};

export default LocaleWrapper;
