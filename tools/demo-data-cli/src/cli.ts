// CLI argument parsing and configuration

import { Command } from 'commander';
import type { CLIOptions } from './types/bulk-import.js';

const program = new Command();

program
  .name('unchained-cli')
  .description('CLI tool for populating demo data into Unchained Engine')
  .version('1.0.0');

program
  .command('populateDemoData')
  .description('Populate the database with demo electronics store data')
  .option('-e, --endpoint <url>', 'Bulk import API endpoint', 'http://localhost:4010/bulk-import')
  .option('-t, --token <token>', 'Authentication token (required unless --dry-run)')
  .option('-p, --products <number>', 'Number of products to generate', '1000')
  .option('-c, --chunk-size <number>', 'Events per API request', '500')
  .option('-d, --dry-run', 'Generate JSON without sending to API', false)
  .option('-o, --output <file>', 'Write generated JSON to file')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    const { runPopulateDemoData } = await import('./commands/populate.js');

    const config: CLIOptions = {
      endpoint: options.endpoint,
      token: options.token || process.env.UNCHAINED_TOKEN || '',
      products: parseInt(options.products, 10),
      chunkSize: parseInt(options.chunkSize, 10),
      dryRun: options.dryRun,
      output: options.output,
      verbose: options.verbose,
    };

    // Validate token unless dry-run
    if (!config.dryRun && !config.token) {
      console.error(
        'Error: Authentication token is required. Use --token or set UNCHAINED_TOKEN environment variable.',
      );
      process.exit(1);
    }

    await runPopulateDemoData(config);
  });

export function runCLI(): void {
  program.parse();
}
