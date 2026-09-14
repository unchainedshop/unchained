<div align="center">

# Unchained Admin UI

[![npm version](https://img.shields.io/npm/v/@unchainedshop/admin-ui.svg)](https://www.npmjs.com/package/@unchainedshop/admin-ui)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)

**The open-source admin dashboard for [Unchained Commerce](https://unchained.shop) — manage your headless e-commerce with AI superpowers**

</div>

---

## 📸 Screenshots

| | | |
|:---:|:---:|:---:|
| ![Products](https://raw.githubusercontent.com/unchainedshop/unchained/master/docs/screenshots/admin-ui-1.png) | ![Dashboard](https://raw.githubusercontent.com/unchainedshop/unchained/master/docs/screenshots/admin-ui-2.png) | ![Product](https://raw.githubusercontent.com/unchainedshop/unchained/master/docs/screenshots/admin-ui-3.png) |

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Copilot** | Built-in AI assistant with Model Context Protocol (MCP) for intelligent automation |
| 📦 **Product Management** | Simple, Bundle, Configurable, Subscription Plans & NFT-tokenized products |
| 🛒 **Order & Fulfillment** | Complete order lifecycle with configurable workflows |
| 💼 **B2B Quotations** | Professional quotation management with approval workflows |
| 📊 **Inventory Control** | Warehouse provider management and product warehousing configuration |
| 💳 **Payment & Shipping** | Integrate any payment gateway or delivery provider |
| 🌍 **Multi-language & Currency** | Full i18n support with country-specific locales |
| 🔐 **Role-Based Access** | Configurable UI permissions with API authorization |
| 🎨 **Customizable Branding** | White-label ready with custom logos |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile |

---

## 🛠️ Tech Stack

<div align="center">

| | | | | |
|:---:|:---:|:---:|:---:|:---:|
| **Next.js 16** | **React 19** | **Apollo GraphQL** | **Tailwind CSS 4** | **TypeScript** |

</div>

Plus: Formik • React Intl • Headless UI • Recharts • Cypress • AI SDK

---

## 🚀 Quick Start

### Prerequisites

- Node.js 26.8.2 or newer (26.8.2 is pinned) for repository development (see [`.nvmrc`](../.nvmrc))
- [Unchained Engine](https://github.com/unchainedshop/unchained) running on `localhost:4010`

### Installation

```bash
# Clone the repository
git clone https://github.com/unchainedshop/unchained.git
cd unchained

# Install workspace dependencies and build the packages and Admin UI
npm install
npm run build

# Start the kitchensink backend, Admin UI, and package watchers
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. To run only the Admin UI against an existing backend, use `npm run dev --workspace @unchainedshop/admin-ui`.

The commands below run from `admin-ui/`.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_GRAPHQL_ENDPOINT` | `/graphql` | GraphQL endpoint; `.env.development` sets `http://localhost:4010/graphql` |
| `NEXT_PUBLIC_CHAT_URL` | `/chat` | Copilot endpoint; `.env.development` sets `http://localhost:4010/chat` |
| `NEXT_PUBLIC_TEMP_FILE_UPLOAD_URL` | `/temp-upload` | Copilot upload endpoint; `.env.development` sets `http://localhost:4010/temp-upload` |
| `UI_PERMISSION_CONFIG` | bundled defaults | Absolute path to a CommonJS permission configuration, read during the build |
| `NEXT_PUBLIC_LOGO` | `/logo-light.svg` | URL to your custom logo |

For a custom backend, set overrides in `admin-ui/.env.local`:

```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-engine.example.com/graphql
NEXT_PUBLIC_CHAT_URL=https://your-engine.example.com/chat
NEXT_PUBLIC_TEMP_FILE_UPLOAD_URL=https://your-engine.example.com/temp-upload
NEXT_PUBLIC_LOGO=https://your-cdn.com/logo.svg
```

---

## 🐳 Deployment

### Static Export

```bash
npm run build
# Output in ./out/ - deploy to a static host
npm run serve # Preview the export locally
```


Public environment variables are embedded during the build. The default export expects the API on the same origin; configure the endpoint overrides before building for a separate backend. UI permissions control the interface; authorization is enforced by the engine API.

### Docker

Build from the repository root and serve the static export on port `3000`:

```bash
docker build -f admin-ui/Dockerfile -t unchained-admin .
docker run --rm -p 3000:3000 unchained-admin
```

Pass `NEXT_PUBLIC_GRAPHQL_ENDPOINT`, `NEXT_PUBLIC_CHAT_URL`, `NEXT_PUBLIC_TEMP_FILE_UPLOAD_URL`, and `NEXT_PUBLIC_LOGO` as `--build-arg` values for a custom backend or branding. See the [Docker deployment guide](../docs/docs/deployment/docker.md).

### Express / Fastify Integration

```typescript
// Express
import { adminUIRouter } from '@unchainedshop/api/express';
app.use('/', adminUIRouter());
```

```typescript
// Fastify
import { adminUIRouter } from '@unchainedshop/api/fastify';
fastify.register(adminUIRouter, { prefix: '/' });
```

The adapters serve the installed `@unchainedshop/admin-ui` export. Fastify also requires `@fastify/static`. For a complete platform connection, pass `adminUI: true` to the API adapter’s `connect()` function, as shown in the kitchensink example.

---

## 📝 Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint:check` | Run ESLint without changing files |
| `npm run format` | Apply ESLint and Prettier fixes |
| `npm run codegen` | Generate GraphQL types |
| `npm run test:e2e` | Run Cypress E2E tests |
| `npm run test:component` | Open Cypress component tests |
| `npm run extract-translation` | Extract i18n strings |
| `npm run compile-translation` | Compile translations |

---

## 🏗️ Architecture

Modular architecture with 27+ domain modules:

```
src/modules/
├── product/           # Catalog & variants
├── order/             # Order management
├── quotation/         # B2B quotations
├── copilot/           # AI assistant
├── token/             # NFT tokenization
├── enrollment/        # Subscriptions
├── assortment/        # Categories
├── accounts/          # Customer management
├── payment-providers/ # Payment gateways
├── delivery-provider/ # Shipping
├── country/           # Multi-country
├── currency/          # Multi-currency
└── ...                # And more
```

Each module follows the pattern:
- `components/` — React components
- `hooks/` — Data fetching hooks (`use{Action}{Entity}`)
- `fragments/` — GraphQL fragments
- `utils/` — Domain utilities

---

<div align="center">

**[Documentation](https://docs.unchained.shop)** • **[Website](https://unchained.shop)**

</div>
