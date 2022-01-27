# New OPEN Questions

3. Is product-discount type used (in api/resolvers/types/product-discount.js)? --> For VeloPlus for 10% day / Black Friday


20. Pattern for Collections used in dedicated plugins (e.g. AppleTransactions, Bity). Create in core (see bity plugin) or provide db in context (see apple-iap plugin) --> Provide as custome module


OPEN TASKS:
- Migration in assortments --> Leave as OPEN ISSUE / keep migrationRepository


## NEW OPEN QUESTIONS (27.01.22)
- Filter caching: Check line 117 (TODO) in _configureFiltersModule_
  - As far as I understand the _isCacheTransformed is set before returning the filter but then never stored somewhere. Thus the information is irrelavant and can be deleted