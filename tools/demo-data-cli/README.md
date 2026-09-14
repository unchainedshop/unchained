# Unchained Demo Data CLI

A CLI tool for populating demo data into an Unchained Engine e-commerce platform using the bulk-import API.

## Features

- Generates electronics store products with extensive multi-language descriptions (default target: 1000)
- Creates 135 hierarchical category assortments
- Defines 10 faceted filters for product navigation
- Supports 3 languages: English, German, French
- Uses 2 currencies: CHF and USD
- Uses the REST bulk-import API for efficient data loading

## Installation

Use Node.js 26.8.2 or newer; the repository `.nvmrc` pins 26.8.2.

```bash
cd tools/demo-data-cli
npm install
npm run build
```

## Usage

### Basic Usage

```bash
# With the token returned by modules.users.createAccessToken(username)
node dist/index.js populateDemoData --token YOUR_AUTH_TOKEN

# Using environment variable
UNCHAINED_TOKEN=YOUR_AUTH_TOKEN node dist/index.js populateDemoData

# The kitchensink example logs a newly generated admin token at startup
node dist/index.js populateDemoData --token TOKEN_FROM_SERVER_LOG
```

### Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--endpoint <url>` | `-e` | `http://localhost:4010/bulk-import` | API endpoint URL |
| `--token <token>` | `-t` | - | Bearer authentication token (required unless --dry-run) |
| `--products <number>` | `-p` | `1000` | Target number of products to generate |
| `--chunk-size <number>` | `-c` | `500` | Events per API request |
| `--dry-run` | `-d` | `false` | Generate JSON without sending to API |
| `--output <file>` | `-o` | - | Write generated JSON to file |
| `--verbose` | `-v` | `false` | Enable verbose logging |

### Examples

```bash
# Request up to 500 products and send to the local server
node dist/index.js populateDemoData -t YOUR_TOKEN -p 500

# Dry run with file output
node dist/index.js populateDemoData --dry-run --output demo-data.json

# Verbose mode with custom endpoint
node dist/index.js populateDemoData \
  -e https://my-unchained.com/bulk-import \
  -t YOUR_TOKEN \
  --verbose

# Large import with smaller chunks
node dist/index.js populateDemoData -t YOUR_TOKEN -p 5000 -c 200
```

## Generated Data

### Products

The `--products` option sets a target. Templates without matching brands are skipped, so the actual count can be lower; the current default target of 1000 produces 912 products. The CLI reports the generated count.

Electronics store products across categories:
- Laptops (gaming, business, ultrabooks)
- Smartphones (Android, iPhone)
- Tablets
- Headphones (wireless, wired, gaming)
- Computer accessories (keyboards, mice, webcams, monitors)
- Phone accessories (cases, chargers, screen protectors)
- Speakers
- Smartwatches
- Fitness trackers
- Gaming (consoles, accessories)
- Home office (printers, routers, storage)
- Cameras (digital, action)

Each product includes:
- Multi-language titles and descriptions (EN/DE/FR)
- Pricing in CHF and USD
- SKU and warehousing data
- Weight specifications
- Category and brand tags

### Assortments (135)

Hierarchical category structure:
```
Electronics Store (root)
  |-- Computers & Laptops
  |     |-- Laptops (Gaming, Business, Ultrabooks)
  |     |-- Desktops
  |     |-- Accessories (Keyboards, Mice, Webcams, Monitors)
  |-- Smartphones & Tablets
  |     |-- Smartphones (Android, iPhone)
  |     |-- Tablets
  |     |-- Accessories (Cases, Chargers, Screen Protectors)
  |-- Audio & Video
  |     |-- Headphones (Wireless, Wired, Gaming)
  |     |-- Speakers
  |     |-- Home Theater
  |-- Wearables (Smartwatches, Fitness Trackers)
  |-- Gaming (Consoles, Accessories, Monitors)
  |-- Home Office (Printers, Routers, Storage)
  |-- Cameras (Digital, Action, Accessories)
  |-- Smart Home
  |-- Networking
  |-- Components
```

### Filters (10)

| Filter | Type | Description |
|--------|------|-------------|
| Brand | MULTI_CHOICE | Apple, Samsung, Sony, Dell, HP, etc. |
| Price Range | MULTI_CHOICE | Buckets calculated from CHF prices: under 100, 100–250, 250–500, etc. |
| In Stock | SWITCH | Availability toggle |
| Rating | MULTI_CHOICE | Customer ratings |
| Color | MULTI_CHOICE | Black, white, silver, blue, etc. |
| Wireless | SWITCH | Wireless products |
| Screen Size | MULTI_CHOICE | Display size ranges |
| Memory | MULTI_CHOICE | RAM/storage options |
| Connectivity | MULTI_CHOICE | USB-C, Bluetooth, WiFi, etc. |
| Featured | SWITCH | Featured products |

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run directly with tsx (development)
npm run dev -- populateDemoData --dry-run
```

## API Requirements

The target Unchained Engine must:
1. Have the bulk-import endpoint enabled
2. Accept Bearer token authentication
3. Have `bulkImport` permission granted to the authenticated user
4. Have CHF/CH and USD/US configured for the generated country-specific prices (the Fastify kitchensink seeds both)

Generated USD prices use a fixed fixture conversion factor rather than a live exchange rate. The importer sends filters first, then products, then assortments with children before their parents.

## Package status

This tool is part of the Unchained Engine repository. Its `private: true` package setting prevents npm publication; it is not a license declaration.
