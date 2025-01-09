---
sidebar_position: 4
sidebar_label: Product Conversion Rates
title: Product Conversion Rates
---
:::info
 Configure the product conversion rates
:::

Unchained has a generic currency conversion system that allows you to easily integrate new feeds for the currency rates.

To insert a new rate (e.g., in a plugin or job that regularly gets new rates from an external source), `modules.products.prices.rates.updateRates(productPriceRates)` is used.
`productPriceRate.timestamp` is the UNIX timestamp when the rate was produced. It is considered when retrieving rates because only those with the user-specified maximum age are returned. When it is set to `null`, the rate is always returned for the given `base` / `quote` pair, no matter the maximum age that the user specifies.

With `modules.products.prices.rates.getRate(baseCurrency, quoteCurrency, referenceDate)`, you can retrieve the rate for a given currency pair that is not older than `referenceDate`.
If there is no rate for the given pair (or the entry is too old), `null` is returned.
Note that the system automatically checks if there is a rate for `baseCurrency` / `quoteCurrency` or `quoteCurrency` / `baseCurrency` (in which case the inverse rate is returned), so you do not have to check both cases.

The rates of this module are consumed by `shop.unchained.pricing.rate-conversion`. The module checks if a rate for the given currency pair (e.g. `EUR` / `CHF`, when the product price is recorded in `CHF` and a `EUR` price is requested) exists. If so, the rate is used to convert the price. With the environment variable `CRYPTOPAY_MAX_RATE_AGE` (default value 10 minutes), you can configure the maximum age (in seconds) of a rate entry such that it still should be considered for the conversion.