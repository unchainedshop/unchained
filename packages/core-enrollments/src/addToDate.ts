export interface DateDuration {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export const addToDate = (
  date: Date,
  { years = 0, months = 0, weeks = 0, days = 0, hours = 0, minutes = 0, seconds = 0 }: DateDuration,
) =>
  new Date(
    Temporal.Instant.fromEpochMilliseconds(date.getTime())
      .toZonedDateTimeISO(Temporal.Now.timeZoneId())
      .add({ years, months, weeks, days, hours, minutes, seconds }).epochMilliseconds,
  );
