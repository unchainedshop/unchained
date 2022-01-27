# New OPEN Questions

3. Is product-discount type used (in api/resolvers/types/product-discount.js)? --> For VeloPlus for 10% day / Black Friday


12. Filters --> Helper: Delete Filter should also delete the FilterTexts of this filter, right? (Similar to assortments) --> Bug: Delete filter texts as well

18. BaseWorker: line 61: Does that work wiht [0]? As far as I could see in the code the schedules need to be strings. But well, it is not really clear to me how this later works... --> 
Leave as is and leave as OPEN ISSUE


20. Pattern for Collections used in dedicated plugins (e.g. AppleTransactions, Bity). Create in core (see bity plugin) or provide db in context (see apple-iap plugin) --> Provide as custome module


OPEN TASKS:
- Migration in assortments --> Leave as OPEN ISSUE / keep migrationRepository
- Invalidate cache for Filters on startup (configureFilterMOdule)


## NEW OPEN QUESTIONS (27.01.22)
- Filter caching: Check line 117 (TODO) in _configureFiltersModule_
  - As far as I understand the _isCacheTransformed is set before returning the filter but then never stored somewhere. Thus the information is irrelavant and can be deleted