## (Known) OPEN ISSUES

_(Discussed between Pascal & Joel on Jan, 27th 2022)_

1. Update documentation for plugins

2. Does the user object exists in the requestContext? So far I used the userId exclusively and fetched
   the user if needed on the fly which looks like an unnecessary overhead.
  - Example (_api/resolvers/mutations/orders/addCartDiscount.ts_ -> line 15)

3. FilterDirector: What are the options? Could not find a call that provides options and thus, the
   options parameter is removed. Requires re-add if needed in other implementations.

4. Npm package: _later_ is deprecated and should be replaced with
   https://www.npmjs.com/package/@breejs/later

5. Not yet migrated plugins:
  - DatatransV2
  - Datatrans
  - Coinbase
