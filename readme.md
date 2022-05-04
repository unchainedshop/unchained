# Unchained Engine

Licensed under the EUPL 1.2

[![CLA assistant](https://cla-assistant.io/readme/badge/unchainedshop/unchained)](https://cla-assistant.io/unchainedshop/unchained)

[![Codeship Status for unchainedshop/currybag-website](https://app.codeship.com/projects/2f18b4a0-57dc-0138-8b6d-4230a644a556/status?branch=master)](https://app.codeship.com/projects/391300)

### **📖 [View Documentation](https://docs.unchained.shop)**

## Code of conduct

See our [Contributor Covenant Code of Conduct](/code_of_conduct.md) to view our pledge, standards,
responsibilites & more.

## Contributing

Please see our [Contribution Guidelines](/contributing.md).

## Quickstart

### Prerequisites

- Meteor 1.11
- Node.js 12.18.3 (lts/erbium, see [.nvmrc](.nvmrc))

### Run the example

```bash
git clone https://github.com/unchainedshop/unchained.git
npm install
npm run dev
```

1. Navigate to http://localhost:4000/ to view the controlpanel. You can login with: user:
   admin@unchained.local / password: password

2. Navigate to http://localhost:4010/graphql to view the GraphQL Playground

## Migration to Unchained 1.0

- Install new peer dependencies: graphql-upload, graphql-scalars, mongodb
- Migrate all custom plugins (see docs for templates)
- Setting renamed: generateOrderNumber -> orderNumberHashFn
- Setting removed: autoSchedulingCronText
