# E-commerce Platform Benchmark

This benchmark compares the performance of three popular e-commerce platforms:
- Unchained
- Medusa
- Vendure

## Requirements

- Node.js 22+
- Docker
- Docker Compose

## Setup

Each platform is containerized with Docker, with the following setup:
- 20,000 products with specific attributes
- 5 root categories with 10 sub-categories each and 10 sub-sub-categories each (500 total)
- Products distributed evenly across categories (40 per leaf category)
- Each product has:
  - 2 prices in different currencies (USD & CHF)
  - 1-3 random images
  - Custom field "color" with a value from a predefined palette
  - Custom field "size" between 1 and 10
  - Faked title, subtitle, brand, tags, labels, and description

## Running the Benchmark

1. Install dependencies:
   ```
   npm install
   ```

2. Run the benchmark:
   
   a. Using individual Docker containers (default):
   ```
   npm run benchmark
   ```
   
   b. Using Docker Compose:
   ```
   npm run benchmark:compose
   ```

The benchmark will:
1. Build Docker images for each platform
2. Start containers with the same resource limits (memory and CPU)
3. Run a series of tests against each platform:
   - Product list query (50 products)
   - Product detail query
   - Category products query
   - Checkout process
4. Display results in a table format

## Benchmark Metrics

The benchmark measures:
- Requests per second
- Average latency
- P99 latency
- Throughput
- Memory usage
- Startup time

## Docker Configuration

Each platform runs in its own container with:
- 2GB memory limit
- 2 CPU cores
- Standardized environment variables
- Mock SMTP server (MailCrab) for email testing

## Customization

You can modify the benchmark parameters in `scripts/benchmark.js`:
- `BENCHMARK_DURATION`: Duration of each test in seconds
- `BENCHMARK_CONNECTIONS`: Number of concurrent connections
- `MEMORY_LIMIT`: Memory limit for containers
- `CPU_LIMIT`: CPU limit for containers

## License

This benchmark is released under the same license as the Unchained project.