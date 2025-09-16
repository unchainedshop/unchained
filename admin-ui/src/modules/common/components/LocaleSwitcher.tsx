import { useRouter } from 'next/router';

const LocaleSwitcher = () => {
  const { pathname, asPath, query, push, locale, locales } = useRouter();

  const handleOnChange = (e) => {
    e.stopPropagation();
    push({ pathname, query }, asPath, {
      locale: e.target.value,
    });
  };

  if (locales?.length < 2) return null;

  return (
    <div className="mr-auto">
      <select
        className="cursor-pointer rounded-md border-1 border-slate-300 dark:border-slate-700 py-1 pr-8 text-sm lg:py-1 lg:pr-10 text-black dark:text-white dark:bg-slate-800 shadow-xs  focus:outline-hidden focus:ring-2 focus:ring-slate-800"
        value={locale}
        onChange={handleOnChange}
      >
        {locales?.map((language) => {
          const displayName = (() => {
            try {
              return (
                new Intl.DisplayNames([locale], {
                  type: 'language',
                }).of(language) || language
              );
            } catch {
              return language;
            }
          })();

          return (
            <option key={language} value={language}>
              {displayName}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default LocaleSwitcher;
