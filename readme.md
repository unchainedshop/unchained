# Unchained Engine

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/unchained?referralCode=ZXvOAF)

Licensed under the EUPL 1.2

[![Bundle Size](https://pkg-size.dev/badge/bundle/1604171)](https://pkg-size.dev/@unchainedshop/platform)
[![CLA assistant](https://cla-assistant.io/readme/badge/unchainedshop/unchained)](https://cla-assistant.io/unchainedshop/unchained)

### **📖 [View Documentation](https://docs.unchained.shop)**

## Code of conduct

See our [Contributor Covenant Code of Conduct](/code_of_conduct.md) to view our pledge, standards,
responsibilites & more.

## Contributing

Please see our [Contribution Guidelines](/contributing.md).

## Quickstart

### Prerequisites

- Node.js >=22 (see [.nvmrc](.nvmrc)) 

### Create an example project

```
npm init @unchainedshop
```

Then navigate to http://localhost:4000/ to view the welcome screen. You can login with: 
user: admin@unchained.local
password: password

### Run local AI for Copilot

A minimum of 24GB VRAM is needed for this.

```
llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
```

### Contribute

```bash
git clone https://github.com/unchainedshop/unchained.git
npm install
npm run dev
```