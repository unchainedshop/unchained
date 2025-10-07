# Logger Performance Benchmarks

Run with: `npm run benchmark`

## Latest Results (October 2025)

```
Test Name                        |      Ops/sec |     Avg Time |   Total Time
---------------------------------|--------------|--------------|-------------
Logger creation (default format) |        1.05M |      0.95 µs |      0.95 ms
Logger creation (JSON format)    |        1.48M |      0.67 µs |      0.67 ms
Log info (default format)        |       11.97M |      0.08 µs |      8.35 ms
Log info (JSON format)           |        1.24M |      0.81 µs |     80.96 ms
Log complex object (JSON)        |      434.31K |     0.002 ms |     23.02 ms
Debug log (enabled)              |       12.31M |      0.08 µs |      8.12 ms
Debug log (disabled)             |      249.22M |      0.00 µs |      0.40 ms
Pattern matching (createLogger)  |        1.43M |      0.70 µs |      3.49 ms
```

## Key Insights

- JSON format logging is **869.1% slower** than default format
- Debug logging when disabled is **20.2x faster** (skips log processing entirely)
- Fastest: Debug log (disabled) at 249.22M ops/s
- Slowest: Complex object logging at 434.31K ops/s

## Optimizations

The current implementation includes targeted optimizations:
- **Regex pattern caching**: Compiled RegExp objects are cached to avoid recreation
- **Pattern result caching**: DEBUG pattern matching results are cached per module
- **No-op functions**: Disabled log levels return empty functions for zero-cost logging