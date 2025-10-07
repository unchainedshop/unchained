# Logger Performance Benchmarks

Run with: `npm run benchmark`

## Latest Results (October 7, 2025 - master branch)

```
Test Name                        |      Ops/sec |     Avg Time |   Total Time
---------------------------------|--------------|--------------|-------------
Logger creation (default format) |      307.63K |     0.003 ms |      3.25 ms
Logger creation (JSON format)    |      241.33K |     0.004 ms |      4.14 ms
Log info (default format)        |        1.22M |      0.82 µs |     81.90 ms
Log info (JSON format)           |        1.13M |      0.89 µs |     88.63 ms
Log complex object (JSON)        |      457.88K |     0.002 ms |     21.84 ms
Debug log (enabled)              |        1.24M |      0.81 µs |     80.62 ms
Debug log (disabled)             |      274.69M |      0.00 µs |      0.36 ms
Pattern matching (createLogger)  |      409.24K |     0.002 ms |     12.22 ms
```

## Key Insights

- JSON format logging is **8.2% slower** than default format
- Debug logging when disabled is **221.5x faster** (skips log processing entirely)
- Fastest: Debug log (disabled) at 274.69M ops/s
- Slowest: Logger creation (JSON format) at 241.33K ops/s