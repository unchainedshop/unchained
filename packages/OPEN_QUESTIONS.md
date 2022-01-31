## OPEN QUESTIONS (_as of Jan, 27th 2022_)
- Assortments Index with none-existing fields: _AssortmentsCollection.ts_ line 34

- Filter caching: Check line 117 (TODO) in _configureFiltersModule_: As far as I understand the _isCacheTransformed is set before returning the filter but then never stored somewhere. Thus the information is irrelavant and can be deleted
