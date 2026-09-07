import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { useContext } from 'react';
import { useIntl } from 'react-intl';
import AppContext from '@/modules/common/components/AppContext';
import useShopInfo from '@/modules/common/hooks/useShopInfo';

/**
 * Resolves the BCP 47 locale used for date & time formatting in the Admin UI.
 *
 * Preserves the selected content locale. Without a valid selection, combines
 * the Admin UI language with the shop country for regional conventions.
 * An explicit region in the UI locale takes precedence over the shop country.
 */
export const resolveDateTimeLocale = (
  uiLocale?: string | null,
  countryCode?: string | null,
  selectedLocale?: string | null,
): string => {
  if (selectedLocale) {
    try {
      return new Intl.Locale(selectedLocale).toString();
    } catch {
      // Ignore invalid stored selections and use the UI language and shop.
    }
  }
  const locale = new Intl.Locale(uiLocale || 'en');
  if (locale.region || !countryCode) return locale.toString();

  try {
    return new Intl.Locale(locale, {
      region: countryCode.toUpperCase(),
    }).toString();
  } catch {
    return locale.toString();
  }
};

const useFormatDateTime = () => {
  const { locale: uiLocale } = useIntl();
  const { shopInfo } = useShopInfo();
  const appContext = useContext(AppContext);
  const locale = resolveDateTimeLocale(
    uiLocale,
    shopInfo?.country?.isoCode,
    appContext?.selectedLocale,
  );

  const formatDateTime = (
    date: unknown,
    options: Intl.DateTimeFormatOptions = {},
  ) => {
    if (
      (typeof date !== 'string' &&
        typeof date !== 'number' &&
        !(date instanceof Date)) ||
      date === ''
    )
      return 'n/a';
    const timestamp = new Date(date).getTime();
    if (Number.isNaN(timestamp)) return 'n/a';

    return new Intl.DateTimeFormat(locale, options).format(timestamp);
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

    return new Intl.DateTimeFormat(locale)
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

  return { formatDateTime, getDateFormatPattern, parseDate, locale };
};

export default useFormatDateTime;
