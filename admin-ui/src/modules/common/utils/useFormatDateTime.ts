import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { useContext } from 'react';
import { useIntl } from 'react-intl';
import AppContext from '../components/AppContext';

const useFormatDateTime = () => {
  const { locale } = useIntl();
  // Prefer the region-qualified locale the user selected for viewing content
  // (e.g. "de-CH", which defaults to the shop's country) so dates follow the
  // region, and fall back to the UI language. Reading the context directly
  // (instead of the throwing useApp hook) keeps this shared helper usable
  // outside the AppContext provider, where it defaults to the UI locale.
  const appContext = useContext(AppContext);
  const activeLocale = appContext?.selectedLocale || locale || undefined;

  const formatDateTime = (date, options: Intl.DateTimeFormatOptions = {}) => {
    if (!date || !Date.parse(date)) return 'n/a';

    return Intl.DateTimeFormat(activeLocale, options).format(
      new Date(date).getTime(),
    );
  };

  const getDateFormatPattern = () => {
    const getPatternForPart = (part) => {
      switch (part.type) {
        case 'day':
          return 'd'.repeat(part.value.length);
        case 'month':
          return 'M'.repeat(part.value.length);
        case 'year':
          return 'y'.repeat(part.value.length);
        case 'literal':
          return part.value;
        default:
          return 'dd.mm.yyyy';
      }
    };

    return new Intl.DateTimeFormat(activeLocale)
      .formatToParts(new Date())
      .map(getPatternForPart)
      .join('');
  };

  const parseDate = (value) => {
    return format(
      fromZonedTime(value, Intl.DateTimeFormat().resolvedOptions().timeZone),
      'yyyy-MM-dd',
    );
  };

  return { formatDateTime, getDateFormatPattern, parseDate };
};

export default useFormatDateTime;
