# vNEXT

TBD

## Breaking Changes

- [core-users] `addEmail` and `updateEmail` no longer send out email verification; you need to trigger the verification using `resendVerificationEmail` mutation.
- [core-users] `enrollUser` doesn't send out the enrollment email by default anymore. You need to trigger it using `sendEnrollmentEmail` mutation. 

## Minor
= [core-users] `sendEnrollmentEmail` mutation is now available to trigger enrollment emails. 

## Patches
- [great-purge-of-meteor] Remove accounts-base and accounts-password from platform package
- [great-purge-of-meteor] Implement new core-accountsjs package
- [great-purge-of-meteor] Convert all authentication related mutations within `api/resolvers/mutations/accounts/loginWithPassword.js` to use accounts-js.
- [great-purge-of-meteor] Convert any Users collection helpers to use accounts-js. 

---
# v0.54.1

## Patches
- [platform] Fix importing bulk assortments should remove old links
- [pricing] Fix critical issue with discounts resolving to a total cart value of 0

# v0.54.0

## Minor
- [logger] Support for JSON Logging through UNCHAINED_LOG_FORMAT=json
- [api] Larger body limit for the new Bulk Import API

---

# v0.53.2

## Minor
- [core] Compound indexes for text entities

## Patches
- [api] Fix rare case where MESSAGE work type lead to an exception

---

# v0.53.2

Hotfix for broken product text editing through controlpanel

## Minor
- [cp] Update deps
- [docs] Add API Reference

## Patches
- [api] Fix updateProductText not updating text

---

# v0.53.1

Minor tweaks and fixes

## Breaking Changes

The new experimental Bulk Import API allows to import a big list of entities (filters, assortments & products) at the same time.

## Minor
- [cp] You can now search for users #242
- [payment] New Plugin: Bity (https://bity.com)
- [payment] New Plugin: Stripe Legacy Charges
- [api] You can now store arbitrary data when using markPaid
- [api] Add a new field Product.defaultOrderQuantity
- [api] Also support "token" in cookies instead of only meteor_login_token

## Patches
- [great-purge-of-meteor] Remove dburles:factory
- [pricing] Fix currencyCode in pricing when using multiple currencies for the same country


---

# v0.53.0

This new Release is published along our new Documentation Page:
https://docs.unchained.shop

Contributions by: @Mikearaya @harryadel @schmidsi @pozylon

## Breaking Changes

New Exceptions: A new exception handling #188 now consistently throws much more intelligent errors with machine-readable error codes than before. This is potentially breaking if you were evaluating the errors thrown in GraphQL Mutations and Queries before.

Datalayer changes:
The following functions now require an authorId to work properly:

- Assortments.createAssortment
- assortment.addProduct
- assortment.addLink
- assortment.addFilter
- Products.createProduct
- product.addMedia (was userId before!)
- product.addMediaLink
- DeliveryProviders.createProvider
- PaymentProviders.createProvider
- WarehousingProviders.createProvider
- Filters.createFilter
- filter.upsertLocalizedText
- variation.upsertLocalizedText
- assortment.upsertLocalizedText
- productMedia.upsertLocalizedText
- product.upsertLocalizedText
- productVariation.upsertLocalizedText

New factory methods to create new Entities (please don't use Entity.insert anymore if you're writing sync code!), they also require authorId now:

- Countries.createCountry
- Currencies.createCurrency
- Languages.createLanguage
- ProductVariations.createVariation
- ProductMedia.createMedia

Changes to Filter Plugins: The async method search on a FilterAdapter is now searchProducts (!). Additionally it's possible to override full-text search of Assortments through searchAssortments.

## Minor

- [platform] Migration messages are now logged through core-logger
- [api] Query.assortments now additionally takes a list of tags and slugs
- [api] Added Query.searchAssortments
- [api] Rename Query.search to Query.searchProducts (Query.search still works but is marked deprecated)
- [api] Exception Handling #188
- [api] Extend Query.users with queryString, allowing to do fulltext searches on users as admin #228
- [core] Refactoring on the underlying Datalayer #190
- [core] It's now possible to control the tax categories for switzerland (mwst, see product-swiss-tax and delivery-swiss-tax plugins)
- [examples] Controlpanel Enhancements #162, #227
- [docs] Add Documentation Beta #205
- [docs] Add documenting comments to the GraphQL schema
- [ci] Added CodeQL Security Scanning #218
- [ci] More tests

## Patches

- [api] Fix edge case with Query.search when slugs is set to null
- [api] Fix privileges when using Mutation.updateProductReview, Mutation.answerQuotation, Mutation.removeBookmark, Mutation.addPaymentCredentials which were supposed to work as non-admin users
- [api] Fix float problem edge case with super long numbers in Money type
- [core] Fix Sort Order when Faceting #211
- [core] Fix Controlpanel Next.js Warnings #201 #209
- [core] Fix a Problem where Work Items are not retried after a Restart #200
- [core] Fix updateCart updating data that should not #198
- [core] Fix slugs regeneration when title is updated #194
- [core] Great Purge of Meteor: Removed aldeed:index #216
- [core] Fix setting the FILE_STORAGE_PATH through env variable for files
- [core] Fix order discounting when multiple discounts are active at the same time
- [examples] Minimal: Upgrade to Meteor 1.11.1 #206
- [examples] Controlpanel: Upgrade to Apollo Client 3 #206

---

# v0.51.0

Contributions by: @harryadelb, @Mikearaya & @pozylon

## Breaking Changes

We will rename all unchained core specific env variables and prefix them with UNCHAINED\_ in the future, for now:

- [api] Siblings return only active products by default now
- [payment] The existing Stripe v1 plugin has been removed because it was unsafe to use and depended on an old API
- [messaging] The architecture of the messaging core plugin has been completely revamped, also the default notification e-mail templates are now loaded as part of the platform package reducing the boilerplate code needed when bootstrapping a fresh unchained project. For example the send-mail delivery provider cannot be used anymore due to refactoring of the messaging system. There is a new one ("send-message") that needs to be used for this case.
- [api] assignments behaves now exactly the same as products, returning only assignments with active products if not specified explicitly with includeInactive = true

## Minor

- [api] Product.siblings now support a parameter "includeInactive" to return inactive products (same like for Assortment.products & search)
- [filters] Search now supports a new parameter "ignoreChildAssortments". When activated it will only consider directly linked products for search, ignoring sub-assortment products.
- [messaging] New Messaging (#163)
- [filter] The filter plugins are now also called when the queryString is empty, allowing cases like user-specific hiding or showing of products system-wide
- [cp] It's now possible to search for products (#178 )
- [tests] Added a whole lot of integration tests (#177 , #176 , #175, #174)
- [api] Improve error reporting when id's (filters, products) don't exist when provided to a mutation
- [payment] Apple In-App-Purchase has landed, supporting stored credentials (#173)
- [payment] Stripe v2 has landed, supporting stored credentials (#179)
- [payment, delivery] Allow to further customize supported providers #161
- Improve performance by using lru-caches at bottleneck points throughout the system
- [worker] It's now possible to define an autoscheduling rule for jobs and the system automatically takes care of setting up the jobs

## Patches

- [examples] Fix a regression bug (simple-schema / seeds) when trying to start the minimal example the first time
- [ci] Skip caching in CI and dev
- [cp] Various small ui fixes
- [platform] Fixes carts on bootup when a delivery / payment provider is not valid anymore.
- [great-purge-of-meteor] Remove aldeed:index

---

# v0.48.0

## Breaking Changes
We will rename all unchained core specific env variables and prefix them with UNCHAINED\_ in the future, for now:

- The Environment variable DISABLE_WORKER has been renamed to UNCHAINED_DISABLE_WORKER
- The Environment variable WORKER_ID has been renamed to UNCHAINED_WORKER_ID
- The Environment variable WORKER_CRON_TEXT has been removed, provide `cronText` as option to startPlatform to configure, use your own env var if still needed.
- The Environment variable FIXTURES has been removed, we will remove the fixtures and faker helpers in the future.
- [core-platform] These 3 worker plugins are automatically loaded and started: EventListenerWorker, CronWorker, FailedRescheduler. Please remove the worker boot code from your project like this: https://github.com/unchainedshop/unchained/commit/89278ce018bcc8ef5861e60f91cf5fde9d2caec9#diff-0f4e94ac3eacf892b0b4f09738a49635
- [api] `getCart` now returns a promise
- [users] the `orders` helper now returns a promise
- [payment] Signature of sign changed slightly, takes transactionContext in first property
- [api] User.lastDeliveryAddress has been removed (was never implemented right)
- [payment] Signature of charge changed slightly, takes the order as order in first property

## Minor

- [subscriptions] Introduce Subscriptions Core Module: Please see PR #158
- [payment,user,subscriptions] Stored Credentials: The Payment and User modules have been enhanced to support storing payment credentials like creditcards, tokens or aliases used to do fast checkouts. PR #158
- [api] All product types now support siblings
- [payment] Datatrans plugin supports aliasing for subscriptions
- [worker] The worker now supports recurring jobs and exposes `configureAutoscheduling` that allows to run a specific plugin continously, first used by subscriptions generating orders at a specific rate
- [platform] startPlatform now supports module specific configuration
- [worker] Heartbeat worker supports waiting for a timeout before completion (helpful for integration tests)
- [examples] The Dockerfile in minimal now supports proper layer caching and speeds up builds in CI if supported by the CI system and the dependencies did not change.
- [assortments] The zipTree function of assortments can now be configured with `modules.assortments.zipTree`
- [delivery] It's now possible to customize the sort order of supported delivery providers `modules.delivery.sortProviders`
- [payment] It's now possible to customize the sort order of supported payment providers `modules.payment.sortProviders`
- [filters] Filters now fallback to no invalidation on startup if not configured
- [logs] Added an index on the created field for logs and also make the log collection expire with a mongodb native feature (https://docs.mongodb.com/manual/tutorial/expire-data/). This should improve db log performance and disk usage

## Patches

- [api] Fixes removeDiscount regression crashing apollo
- [worker] Now experimental interval worker which does not depend on SyncedCron
- [examples] Various Fixes in Controlpanel
- [examples] Various console output and lint issues
- [tests] Fixed various tests
