# Logger Performance Benchmarks

Run with: `npm run benchmark`

## Latest Results (October 7, 2025)

```
Test Name                        |      Ops/sec |     Avg Time |   Total Time
---------------------------------|--------------|--------------|-------------
Logger creation (default format) |      935.97K |     0.001 ms |      1.07 ms
Logger creation (JSON format)    |        1.27M |      0.79 µs |      0.79 ms
Log info (default format)        |        8.15M |      0.12 µs |     12.28 ms
Log info (JSON format)           |        1.25M |      0.80 µs |     79.87 ms
Log complex object (JSON)        |      465.65K |     0.002 ms |     21.48 ms
Debug log (enabled)              |        8.34M |      0.12 µs |     11.99 ms
Debug log (disabled)             |      299.36M |      0.00 µs |      0.33 ms
Pattern matching (createLogger)  |        1.21M |      0.82 µs |      4.12 ms
```

## Key Insights

- JSON format logging is **550.6% slower** than default format
- Debug logging when disabled is **35.9x faster** (skips log processing entirely)
- Fastest: Debug log (disabled) at 299.36M ops/s
- Slowest: Complex object logging at 465.65K ops/s

## Optimizations

The current implementation includes targeted optimizations:
- **Regex pattern caching**: Compiled RegExp objects are cached to avoid recreation
- **Pattern result caching**: DEBUG pattern matching results are cached per module
- **No-op functions**: Disabled log levels return empty functions for zero-cost logging