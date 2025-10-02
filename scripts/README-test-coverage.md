# Test Coverage Analysis Script

This script analyzes the Unchained e-commerce platform's GraphQL API and REST endpoint test coverage.

## Usage

```bash
node scripts/analyze-test-coverage.mjs > docs/TEST_COVERAGE_ANALYSIS.md
```

## What It Does

The script:

1. **Extracts GraphQL Operations**: Parses `packages/api/src/schema/mutation.ts` and `packages/api/src/schema/query.ts` to find all defined mutations and queries

2. **Extracts REST Endpoints**: Scans the following files for Fastify route definitions:
   - `packages/plugins/src/presets/all-fastify.ts` - Payment webhook endpoints
   - `packages/plugins/src/presets/base-fastify.ts` - GridFS file storage endpoints
   - `packages/plugins/src/presets/crypto-fastify.ts` - Cryptopay webhook endpoints
   - `packages/ticketing/src/fastify.ts` - Ticketing endpoints (Apple Wallet, Google Wallet, PDF printing)

3. **Analyzes Test Coverage**: Scans all `tests/*.test.js` files to identify:
   - Which GraphQL operations are tested
   - Which REST endpoints are tested

4. **Generates Report**: Creates a comprehensive markdown report showing:
   - Summary statistics with coverage percentages
   - Detailed tables of all operations/endpoints with test status
   - Categorized listings for easy navigation
   - Key findings and recommendations

## Output

The script generates `docs/TEST_COVERAGE_ANALYSIS.md` with:

- Summary statistics table
- REST endpoints coverage table (with tested file names)
- GraphQL mutations coverage table (categorized by domain)
- GraphQL queries coverage table (categorized by domain)
- Key findings section highlighting critical gaps
- Recommendations for improving test coverage

## Categories

Operations are automatically categorized into logical groups:

**Mutations**: Authentication & Users, Web3 & WebAuthn, Products, Product Variations, Product Bundles, Product Reviews, Assortments, Filters, Warehousing, Delivery, Payment, Orders & Cart, Order Management, Quotations, Enrollments, Bookmarks, Subscriptions, etc.

**Queries**: Users, Products, Search, Assortments, Filters, Orders, Quotations, Enrollments, Product Reviews, Warehousing, Delivery, Payment, Localization, Tokens, Events & Statistics, Shop Config

**REST Endpoints**: Payment Webhooks, File Storage, Ticketing

## Updating the Analysis

Run this script after:

- Adding new GraphQL mutations or queries
- Adding new REST endpoints
- Adding new integration tests
- Significant changes to test coverage

This helps track progress toward comprehensive test coverage.
