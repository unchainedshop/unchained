// Shared era-based tax rate resolution. Regional rate tables (ch, eu, uk, us)
// are bundled JSON files listing, per category/jurisdiction, the eras a rate
// was in force: [{ validFrom, rate }]. Boundaries are civil dates in each
// jurisdiction's IANA time zone. The applicable rate follows the supply date,
// so tables keep their full history and are only ever appended to — see the
// `update-tax-rates` skill.

export interface TaxRateEra {
  validFrom: string;
  rate: number;
}

export interface CompiledTaxRateEra {
  validFrom: string;
  rate: number;
  timeZone: string;
}

const formatDateInTimeZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
};

const isIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
  );
};

export const compileEraRates = (eras: TaxRateEra[], timeZone: string): CompiledTaxRateEra[] => {
  // Validate the IANA zone while compiling the static table, rather than on
  // the first pricing request.
  new Intl.DateTimeFormat('en-US', { timeZone });

  return eras
    .map(({ validFrom, rate }) => {
      if (!isIsoDate(validFrom)) {
        throw new TypeError(`Invalid tax era date '${validFrom}'`);
      }
      return { validFrom, rate, timeZone };
    })
    .sort((left, right) => left.validFrom.localeCompare(right.validFrom));
};

export const rateForDate =
  (eras: CompiledTaxRateEra[]) =>
  (referenceDate: Date = new Date()): number => {
    if (!eras.length) throw new TypeError('Cannot resolve a tax rate from an empty era list');
    if (!Number.isFinite(referenceDate.getTime())) throw new TypeError('Invalid tax reference date');

    const localDate = formatDateInTimeZone(referenceDate, eras[0].timeZone);
    // dates before the first recorded era clamp to the earliest known rate
    let applicable = eras[0];
    for (const era of eras) {
      if (era.validFrom <= localDate) applicable = era;
    }
    return applicable.rate;
  };
