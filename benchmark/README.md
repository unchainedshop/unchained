# E-Commerce Platform Benchmark

This project provides a comprehensive benchmark for comparing the performance of three popular e-commerce platforms:

- [Medusa](https://medusajs.com/)
- [Vendure](https://www.vendure.io/)
- [Unchained](https://unchained.shop/)

## Overview

The benchmark simulates a webshop with 20,000 products across a deep category structure and tests various common e-commerce operations such as:

- Product listing
- Category browsing
- Faceted search
- Checkout process

## Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- npm or yarn

### Installation

1. Clone this repository
2. Navigate to the benchmark directory:
   ```
   cd benchmark
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Running the Benchmark

### Start the Containers

```
docker-compose up -d
```

This will start:

- All three e-commerce platforms
- Required databases (PostgreSQL, MongoDB)
- Redis for caching
- Mailcrab for email testing

### Seed Test Data

Before running the benchmarks, you need to seed the platforms with test data:

```
npm run seed
```

This will create:

- 20,000 products
- 5 main categories with 3 subcategories each
- Products distributed across categories
- Products with various attributes (color, size, etc.)

### Run the Benchmark

```
npm run benchmark
```

The benchmark will test:

1. Product listing performance
2. Category browsing performance
3. Faceted search performance
4. Checkout process performance

Results will be saved to the `results.json` file and displayed in the console.

## Benchmark Parameters

You can modify the benchmark parameters in the `benchmark.js` file:

- `duration`: Test duration in seconds
- `connections`: Number of concurrent connections
- `pipelining`: Number of pipelined requests per connection

## Mock Servers

The benchmark uses simplified mock servers for each platform to ensure a fair comparison of the API architectures without the complexity of full implementations.

- **Vendure**: REST API at port 3001
- **Medusa**: REST API at port 3002
- **Unchained**: GraphQL API at port 3003

## Results Interpretation

The benchmark measures:

- Requests per second
- Latency (min, max, average)
- Request errors
- Response times by percentile

Higher requests per second and lower latency indicate better performance.

## License

MIT 