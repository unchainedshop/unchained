# Logger Performance Benchmarks

Run with: `npm run benchmark`

## Latest Results (October 2025)

```
Test Name                        |      Ops/sec |     Avg Time |   Total Time
---------------------------------|--------------|--------------|-------------
Logger creation (default format) |      315.27K |     0.003 ms |      3.17 ms
Logger creation (JSON format)    |      279.00K |     0.004 ms |      3.58 ms
Log info (default format)        |      615.98K |     0.002 ms |    162.34 ms
Log info (JSON format)           |      367.35K |     0.003 ms |    272.22 ms
Log complex object (JSON)        |      223.04K |     0.004 ms |     44.83 ms
Debug log (enabled)              |      383.33K |     0.003 ms |    260.88 ms
Debug log (disabled)             |      250.26M |      0.00 µs |      0.40 ms
Pattern matching (createLogger)  |      406.37K |     0.002 ms |     12.30 ms
```

## Key Insights

- JSON format logging is **67.7% slower** than default format
- Debug logging when disabled is **652.9x faster** (skips log processing entirely)
- Fastest: Debug log (disabled) at 250.26M ops/s
- Slowest: Complex object logging at 223.04K ops/s