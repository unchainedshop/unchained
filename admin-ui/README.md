<div align="center">

# Unchained Admin UI

[![npm version](https://img.shields.io/npm/v/@unchainedshop/admin-ui.svg)](https://www.npmjs.com/package/@unchainedshop/admin-ui)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
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
| 📊 **Inventory Control** | Multi-warehouse tracking with low-stock alerts |
| 💳 **Payment & Shipping** | Integrate any payment gateway or delivery provider |
| 🌍 **Multi-language & Currency** | Full i18n support with country-specific locales |
| 🔐 **Role-Based Access** | Granular permissions with build-time security |
| 🎨 **Customizable Branding** | White-label ready with custom logos |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile |

---

## 🛠️ Tech Stack

<div align="center">

| | | | | |
|:---:|:---:|:---:|:---:|:---:|
| **Next.js 15** | **React 19** | **Apollo GraphQL** | **Tailwind CSS 4** | **TypeScript** |

</div>

Plus: Formik • React Intl • Headless UI • Recharts • Cypress • AI SDK

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- [Unchained Engine](https://github.com/unchainedshop/unchained) running on `localhost:4010`

### Installation

```bash
# Clone the repository
git clone git@github.com:unchainedshop/unchained.git
cd admin-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_GRAPHQL_ENDPOINT` | `http://localhost:4010/graphql` | Unchained Engine GraphQL endpoint |
| `NEXT_PUBLIC_LOGO` | — | URL to your custom logo |

Create a `.env.local` file for local development:

```bash
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-engine.example.com/graphql
NEXT_PUBLIC_LOGO=https://your-cdn.com/logo.svg
```

---

## 🐳 Deployment

### Static Export (Recommended)

```bash
npm run build
# Output in ./out/ - deploy to any CDN (Vercel, Netlify, S3, etc.)
```


### Express / Fastify Integration

```typescript
// Express
import { expressRouter } from '@unchainedshop/admin-ui/express';
app.use('/admin', expressRouter);

// Fastify
import { fastifyRouter } from '@unchainedshop/admin-ui/fastify';
fastify.register(fastifyRouter, { prefix: '/admin' });
```

### 🎨 Custom Theming

The admin UI uses semantic CSS custom property tokens for all surface, text, and border colors. Engine consumers can override these at runtime — no rebuild required.

Pass a `theme` object when connecting the admin UI:

```typescript
await connect(fastify, platform, {
  adminUI: {
    prefix: '/',
    theme: {
      surface: '#ffffff',
      'surface-subtle': '#f8fafc',
      'surface-raised': '#f1f5f9',
      'surface-input': '#ffffff',
      border: '#cbd5e1',
      'border-subtle': '#e2e8f0',
      'text-primary': '#0f172a',
      'text-secondary': '#475569',
      'text-muted': '#64748b',
      accent: '#8b5cf6',
      'accent-hover': '#7c3aed',
      danger: '#f43f5e',
      'danger-surface': '#fff1f2',
      success: '#10b981',
      warning: '#f59e0b',
    },
  },
});
```

You only need to include the tokens you want to override — unset tokens use the built-in defaults. Each key maps to a `--token-{key}` CSS variable. The engine serves these as `/admin-ui-theme.css` which loads before first paint (no flicker).

Available tokens:

| Token | Light default | Description |
|-------|--------------|-------------|
| `surface` | `#ffffff` | Main backgrounds (cards, modals) |
| `surface-subtle` | `#f8fafc` | Page backgrounds |
| `surface-raised` | `#f1f5f9` | Hover states, raised elements |
| `surface-input` | `#ffffff` | Form input backgrounds |
| `border` | `#cbd5e1` | Default borders |
| `border-subtle` | `#e2e8f0` | Subtle/secondary borders |
| `text-primary` | `#0f172a` | Headings, primary text |
| `text-secondary` | `#475569` | Labels, secondary text |
| `text-muted` | `#64748b` | Captions, placeholders |
| `accent` | `#1e293b` | Primary buttons, active elements |
| `accent-hover` | `#020617` | Hover state for accent |
| `danger` | `#f43f5e` | Error states, destructive actions |
| `danger-surface` | `#fff1f2` | Danger background |
| `success` | `#10b981` | Success states |
| `warning` | `#f59e0b` | Warning states |

Dark mode values are defined separately in `globals.css` and activate automatically when the `.dark` class is on `<html>`.

---

## 📝 Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with debugging |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run codegen` | Generate GraphQL types |
| `npm run test:e2e` | Run Cypress E2E tests |
| `npm run test:component` | Run Cypress component tests |
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
├── user/              # Customer management
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
