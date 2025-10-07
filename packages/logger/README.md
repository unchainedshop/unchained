# Logger (Unchained Engine)

A high-performance, feature-rich logging package for Unchained Engine with support for multiple formats, log levels, and debug patterns.

## Features

- 🚀 **High Performance**: Optimized for speed with caching and no-op functions for disabled log levels
- 🎨 **Multiple Formats**: Support for both human-readable (unchained) and JSON formats
- 🔍 **Debug Patterns**: Flexible DEBUG environment variable with wildcards and exclusions
- 📊 **Log Levels**: Five log levels (trace, debug, info, warn, error) with environment-based filtering
- 💪 **TypeScript**: Full TypeScript support with type definitions
- 🔧 **Zero Dependencies**: Core functionality with minimal external dependencies

## Installation

```bash
npm install @unchainedshop/logger
```

## Usage

### Basic Usage

```typescript
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('my-module');

logger.info('Application started');
logger.debug('Debug information', { userId: 123 });
logger.error('Something went wrong', new Error('Details'));
```

### Environment Variables

#### `UNCHAINED_LOG_FORMAT`
Controls the output format:
- `unchained` (default): Human-readable format with colors
- `json`: Machine-readable JSON format

```bash
UNCHAINED_LOG_FORMAT=json node app.js
```

#### `LOG_LEVEL`
Sets the minimum log level:
- `verbose` or `trace`: All logs
- `debug`: Debug and above
- `info` (default): Info and above
- `warn`: Warnings and errors only
- `error`: Errors only

```bash
LOG_LEVEL=debug node app.js
```

#### `DEBUG`
Enables debug logging for specific modules using pattern matching:
- Wildcards: `DEBUG=app:*`
- Exclusions: `DEBUG=*,-app:excluded`
- Multiple patterns: `DEBUG=app:*,core:*`

```bash
DEBUG=my-module,other:* node app.js
```

## API

### `createLogger(moduleName: string): Logger`

Creates a logger instance for the specified module.

**Parameters:**
- `moduleName` - The name of the module (used for filtering and display)

**Returns:** Logger instance with methods: `trace`, `debug`, `info`, `warn`, `error`

### Default Logger

```typescript
import { log, defaultLogger } from '@unchainedshop/logger';

// Quick logging with default logger
log('Quick info message');

// Or use the default logger directly
defaultLogger.info('Info message');
```

## Performance

See [benchmarks/README.md](./benchmarks/README.md) for detailed performance metrics.

Key performance features:
- **Zero-cost disabled logging**: Log levels below the minimum use no-op functions
- **Regex caching**: Pattern matching results are cached for speed
- **Optimized hot paths**: Critical logging paths are optimized for maximum throughput
