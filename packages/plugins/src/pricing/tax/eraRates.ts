// Shared era-based tax rate resolution. Regional rate tables (ch, eu, uk, us)
// are bundled JSON files listing, per category/jurisdiction, the eras a rate
// was in force: [{ validFrom, rate }]. The applicable rate follows the supply
// date, so tables keep their full history and are only ever appended to —
// see the `update-tax-rates` skill.

export interface TaxRateEra {
  validFrom: string;
  rate: number;
}

export interface CompiledTaxRateEra {
  validFrom: number;
  rate: number;
}

export const compileEraRates = (eras: TaxRateEra[], utcOffset: string): CompiledTaxRateEra[] =>
  eras
    .map(({ validFrom, rate }) => ({
      // rate changes take effect at midnight local time of the jurisdiction;
      // the table's utcOffset approximates that boundary
      validFrom: new Date(`${validFrom}T00:00:00.000${utcOffset}`).getTime(),
      rate,
    }))
    .sort((left, right) => left.validFrom - right.validFrom);

export const rateForDate =
  (eras: CompiledTaxRateEra[]) =>
  (referenceDate: Date = new Date()): number => {
    const time = referenceDate.getTime();
    // dates before the first recorded era clamp to the earliest known rate
    let applicable = eras[0];
    for (const era of eras) {
      if (era.validFrom <= time) applicable = era;
    }
    return applicable.rate;
  };
