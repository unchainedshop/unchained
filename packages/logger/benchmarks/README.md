# Logger Performance Benchmarks

Run from this package with `npm run benchmark`, or from the repository root:

```bash
npm run benchmark --workspace @unchainedshop/logger
```

The benchmark measures logger creation, human-readable and JSON logging, complex object formatting, enabled/disabled debug logging, and DEBUG pattern matching. It prints operations per second and elapsed times for the current runtime.

Console output is suppressed during measurements, so results measure logger processing rather than terminal or log-collector throughput. Record the Node.js version and hardware when comparing runs.
