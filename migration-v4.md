# Migration Guide v3 -> v4

With this release we fix some long standing issues with the way we named certain fields in the API and in our Codebase. That means this version will propably break clients, plugins and bulk import streams.

## Currency & Country Codes

We have removed the ambigouity about the currency iso codes. Before it was not clear if a currency for example is an object of a currency or a string. Sometimes we used currency, sometimes we used currencyContext and sometimes currencyCode.

- All queries and mutations that had a currency input or field are renamed to **currencyCode** unless it's a Currency object itself
- All queries and mutations that had a country input or field are renamed to **countryCode** unless it's a Country object itself
- The context.currencyContext has been renamed to **context.currencyCode**
- The context.countryContext has been renamed to **context.countryCode**
- A migration renames currency to currencyCode in: `Orders`, `Quotations`

Developer tasks:
- Migrations actually missing
- Check new loaders if it's okay to return null values because they could when a country/currency/user has been removed