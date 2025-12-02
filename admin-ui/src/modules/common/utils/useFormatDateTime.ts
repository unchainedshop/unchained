import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

const useFormatDateTime = () => {
  const formatDateTime = (date, options: Intl.DateTimeFormatOptions = {}) => {
    if (!date || !Date.parse(date)) return 'n/a';

    return Intl.DateTimeFormat(undefined, options).format(
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

    return new Intl.DateTimeFormat(undefined)
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
