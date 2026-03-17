type ArrayElement<T> = T extends (infer U)[] ? U : never;

/*
 * Performance-critical hot path — called by 6 DataLoader batch functions.
 *
 * Optimization attempts benchmarked (Node 22, 30–10000 texts):
 *  - Object.groupBy pre-pass:        ~neutral — V8 JIT already optimizes the continue-skip via branch prediction
 *  - Object.create(null) for textsMap: ~1% — dictionary mode already skips prototype chain
 *  - Map instead of plain object:      20-60% SLOWER at scale — Map overhead + conversion back to object
 *  - Set to track exact-match keys:    40% SLOWER — Set hashing overhead exceeds branch savings
 *  - Inverted loop (texts-first):      10% faster but BREAKS semantics — changes fallback priority from
 *                                      localeMap-key-order to text-array-order (test: "Two fallback locales competing")
 *  - Two-pass (exact first, fallbacks second) + precomputed buildId + grouping: 5-8% faster —
 *    best correct result, but doubles code size for marginal gain
 *
 * The current O(K×N) scan with continue-skip is near-optimal because:
 *  1. V8 TurboFan branch-predicts the `continue` at ~80% hit rate
 *  2. String comparisons on short interned locale strings are pointer comparisons
 *  3. Any grouping/precomputation adds allocation overhead that cancels iteration savings
 */

export default function buildTextMap<T extends { locale?: string }[]>(
  localeMap: Record<string, string[]>,
  texts: Readonly<T>,
  buildId: (item: ArrayElement<T>) => string,
) {
  const textsMap: Record<string, ArrayElement<T>> = {}; // Added type for textsMap
  const localeMapKeys = Object.keys(localeMap);

  for (const originLocale of localeMapKeys) {
    const localesForText = localeMap[originLocale];

    for (const text of texts) {
      if (originLocale !== text.locale) continue;

      const idPart = buildId(text as ArrayElement<T>);

      for (const locale of localesForText) {
        const key = locale + idPart;
        if (textsMap[key] && locale !== text.locale) {
          continue;
        }
        textsMap[key] = text as ArrayElement<T>;
      }
    }
  }
  return textsMap;
}
