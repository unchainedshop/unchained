/* eslint-disable */
// @ts-nocheck

/* esm.sh - esbuild bundle(date-fns@4.1.0/add) es2022 production */
const F = Math.pow(10, 8) * 24 * 60 * 60 * 1e3,
  b = -F;
const N = 3600;
const a = N * 24,
  k = a * 7,
  Y = a * 365.2425,
  T = Y / 12,
  w = T * 3,
  p = Symbol.for('constructDateFrom');
function r(t, o) {
  return typeof t == 'function'
    ? t(o)
    : t && typeof t == 'object' && p in t
      ? t[p](o)
      : t instanceof Date // @ts-ignore
        ? new t.constructor(o)
        : new Date(o);
}
function c(t, o) {
  return r(o || t, t);
}
function f(t, o, e) {
  const n = c(t, e?.in);
  return isNaN(o) ? r(e?.in || t, NaN) : (o && n.setDate(n.getDate() + o), n);
}
function x(t, o, e) {
  const n = c(t, e?.in);
  if (isNaN(o)) return r(e?.in || t, NaN);
  if (!o) return n;
  const i = n.getDate(),
    s = r(e?.in || t, n.getTime());
  s.setMonth(n.getMonth() + o + 1, 0);
  const m = s.getDate();
  return i >= m ? s : (n.setFullYear(s.getFullYear(), s.getMonth(), i), n);
}

export function addToDate(t, o, e?: any) {
  let {
      years: n = 0,
      months: i = 0,
      weeks: s = 0,
      days: m = 0,
      hours: I = 0,
      minutes: l = 0,
      seconds: h = 0,
    } = o,
    u = c(t, e?.in),
    d = i || n ? x(u, i + n * 12) : u,
    y = m || s ? f(d, m + s * 7) : d,
    D = l + I * 60,
    M = (h + D * 60) * 1e3;
  return r(e?.in || t, +y + M);
}
//# sourceMappingURL=add.js.map
