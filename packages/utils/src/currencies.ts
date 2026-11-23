const ISO_MINOR_UNITS: Record<string, number> = {
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  ISK: 0,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
};

const isoCurrencyCodes = new Set(Intl.supportedValuesOf('currency'));

export const isoCurrencyDecimals = (isoCode: string) => {
  const code = isoCode.toUpperCase();
  if (!isoCurrencyCodes.has(code)) return undefined;
  return ISO_MINOR_UNITS[code] ?? 2;
};
