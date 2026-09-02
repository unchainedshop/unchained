---
name: update-tax-rates
description: Verify and update the bundled tax rate tables (Swiss ch-tax-rates.json, EU eu-tax-rates.json, UK uk-tax-rates.json, US us-tax-rates.json in packages/plugins/src/pricing/tax/) against their official sources. Use when a tax/VAT rate change is announced or takes effect anywhere, for the periodic yearly verification, or when someone asks to update/check tax rates.
---

# Update bundled tax rates

The regional tax pricing adapters read their rates from bundled JSON tables in
`packages/plugins/src/pricing/tax/`:

| File | Region | Structure |
| --- | --- | --- |
| `ch-tax-rates.json` | Switzerland | `categories` (default/reduced/special) |
| `eu-tax-rates.json` | 27 EU member states | `countries` → categories (standard/reduced/reduced2/super_reduced/parking) |
| `uk-tax-rates.json` | UK VAT area | `categories` (standard/reduced/zero) |
| `us-tax-rates.json` | 50 US states + DC | `states` (statewide base rate) |

Each category/state holds an **era list** `[{ validFrom: "YYYY-MM-DD", rate }]`
— the full rate history, because the applicable rate follows the supply date.
Rates are deliberately **not** fetched at runtime: they are legally binding,
so every change must land as a reviewable, versioned diff. This skill is that
workflow.

## Ground rules (read first)

- **Never guess, extrapolate, or infer a rate.** Only rates read verbatim
  from the official sources below may be written.
- **Never modify or delete existing eras** — historical orders are priced by
  their supply date. A change is always a **new appended era**. Temporary
  cuts are modeled as two eras (the cut and the restoration).
- **Cross-check every change against a second source** before writing. If
  sources are unreachable, contradict each other, or are ambiguous: **abort
  without changes** and report what you saw.
- Rates are decimal fractions (8.1% → `0.081`), and `validFrom` is the legal
  effective date in the jurisdiction's local time. Preserve the IANA zones in
  `timezone` (CH/UK) or `timezones` (EU/US); add a jurisdiction mapping when a
  new jurisdiction is added. Do not replace them with fixed UTC offsets,
  because those do not model daylight-saving changes.
- Scope reclassifications (a product class moving between existing
  categories) are NOT rate changes — note them in your report, don't touch
  the tables.

## Official sources

| Region | Primary | Cross-check |
| --- | --- | --- |
| CH | ESTV: https://www.estv.admin.ch/estv/en/home/value-added-tax/vat-rates-switzerland.html | MWSTG Art. 25 on Fedlex: https://www.fedlex.admin.ch/eli/cc/2009/615/de |
| EU | EC "Taxes in Europe" database: https://ec.europa.eu/taxation_customs/tedb/#/vat-search | The affected member state's finance-ministry/tax-authority page |
| UK | https://www.gov.uk/vat-rates | HMRC manuals / legislation.gov.uk for effective dates |
| US | The affected state's Department of Revenue | Tax Foundation state rate table (current edition) |

## Procedure

1. **Read the current tables** and note each file's `verifiedAt` and the
   latest era per category/state.
2. **Fetch the primary source per region** (start with regions the user
   named, else all four). Extract current rates AND any announced future
   change with a fixed legal effective date.
3. **Cross-check** each detected change with the region's second source.
4. **Update the JSON files**: append `{ "validFrom", "rate" }` eras (keep
   ascending order; already-enacted future changes may be added early — the
   era logic applies them only once the date is reached). Update `verifiedAt`
   to today in every file you verified, even when nothing changed.
5. **Update the tests** (`ch.test.ts`, `eu.test.ts`, `uk.test.ts`,
   `us.test.ts` next to the tables): add boundary assertions for each new era
   (one date before, one after) and fix any "current rate" assertions that
   the change affects.
6. **Run the tests:**
   `node --test packages/plugins/src/pricing/tax/` — all must pass, including
   each file's JSON-consistency suite (ascending eras, plausible rates,
   metadata).
7. **Report for human review — do not commit on your own.** Show the JSON
   diffs, quote the exact source passages (with URLs) each new rate came
   from, and remind that a maintainer must confirm before commit/release.
   Downstream projects receive updated rates via a normal package update.
