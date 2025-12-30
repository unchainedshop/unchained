// Main populate demo data command implementation

import * as fs from 'fs';
import type { CLIOptions, BulkImportEvent, BulkImportPayload } from '../types/bulk-import.js';
import { generateFilters, generateProducts, generateAssortments, getAssortmentCount } from '../generators/index.js';
import { sendBulkImport, type HttpClientConfig } from '../utils/http-client.js';
import {
  ProgressReporter,
  logSection,
  logSuccess,
  logError,
  logInfo,
  formatDuration,
} from '../utils/progress.js';

interface ImportStats {
  filters: { total: number; sent: number; failed: number };
  products: { total: number; sent: number; failed: number };
  assortments: { total: number; sent: number; failed: number };
  startTime: number;
  endTime?: number;
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function runPopulateDemoData(options: CLIOptions): Promise<void> {
  const stats: ImportStats = {
    filters: { total: 0, sent: 0, failed: 0 },
    products: { total: 0, sent: 0, failed: 0 },
    assortments: { total: 0, sent: 0, failed: 0 },
    startTime: Date.now(),
  };

  console.log('\n========================================');
  console.log('  Unchained Demo Data Populator');
  console.log('========================================\n');

  if (options.dryRun) {
    logInfo('Running in DRY RUN mode - no data will be sent to the API');
  }

  logInfo(`Target: ${options.products} products`);
  logInfo(`Endpoint: ${options.endpoint}`);
  logInfo(`Chunk size: ${options.chunkSize} events per request`);

  // Step 1: Generate Filters
  logSection('Step 1: Generating Filters');
  const filterEvents = generateFilters();
  stats.filters.total = filterEvents.length;
  logSuccess(`Generated ${filterEvents.length} filters`);

  // Step 2: Generate Products
  logSection('Step 2: Generating Products');
  const productProgress = new ProgressReporter({
    total: options.products,
    label: 'Products',
  });

  const generatedProducts = generateProducts(options.products);
  const productEvents = generatedProducts.map((p) => p.event);
  stats.products.total = productEvents.length;

  productProgress.update(productEvents.length);
  productProgress.complete();
  logSuccess(`Generated ${productEvents.length} products`);

  // Step 3: Generate Assortments
  logSection('Step 3: Generating Assortments');
  const assortmentEvents = generateAssortments(generatedProducts);
  stats.assortments.total = assortmentEvents.length;
  logSuccess(`Generated ${assortmentEvents.length} assortments`);

  // Combine all events
  const allEvents: BulkImportEvent[] = [...filterEvents, ...productEvents, ...assortmentEvents];

  logSection('Summary');
  logInfo(`Total events: ${allEvents.length}`);
  logInfo(`  - Filters: ${stats.filters.total}`);
  logInfo(`  - Products: ${stats.products.total}`);
  logInfo(`  - Assortments: ${stats.assortments.total}`);

  // Write to file if requested
  if (options.output) {
    logSection('Writing to File');
    const payload: BulkImportPayload = { events: allEvents };
    fs.writeFileSync(options.output, JSON.stringify(payload, null, 2));
    logSuccess(`Written to ${options.output}`);
  }

  // Send to API unless dry-run
  if (!options.dryRun) {
    logSection('Step 4: Sending to API');

    const httpConfig: HttpClientConfig = {
      endpoint: options.endpoint,
      token: options.token,
      verbose: options.verbose,
    };

    // Send filters first (single chunk)
    console.log('\nSending filters...');
    const filterResult = await sendBulkImport({ events: filterEvents }, httpConfig);
    if (filterResult.success) {
      stats.filters.sent = filterResult.eventsCount;
      logSuccess(`Filters sent successfully (work ID: ${filterResult.workId})`);
    } else {
      stats.filters.failed = filterResult.eventsCount;
      logError(`Failed to send filters: ${filterResult.error}`);
    }

    // Send products in chunks
    console.log('\nSending products...');
    const productChunks = chunkArray(productEvents, options.chunkSize);
    const productProgress2 = new ProgressReporter({
      total: productChunks.length,
      label: 'Product chunks',
    });

    for (let i = 0; i < productChunks.length; i++) {
      const chunk = productChunks[i];
      const result = await sendBulkImport({ events: chunk }, httpConfig);

      if (result.success) {
        stats.products.sent += result.eventsCount;
      } else {
        stats.products.failed += result.eventsCount;
        if (options.verbose) {
          logError(`Chunk ${i + 1} failed: ${result.error}`);
        }
      }

      productProgress2.update(i + 1);
    }
    productProgress2.complete();

    // Send assortments in chunks (they're already sorted by hierarchy)
    console.log('\nSending assortments...');
    const assortmentChunks = chunkArray(assortmentEvents, options.chunkSize);
    const assortmentProgress = new ProgressReporter({
      total: assortmentChunks.length,
      label: 'Assortment chunks',
    });

    for (let i = 0; i < assortmentChunks.length; i++) {
      const chunk = assortmentChunks[i];
      const result = await sendBulkImport({ events: chunk }, httpConfig);

      if (result.success) {
        stats.assortments.sent += result.eventsCount;
      } else {
        stats.assortments.failed += result.eventsCount;
        if (options.verbose) {
          logError(`Chunk ${i + 1} failed: ${result.error}`);
        }
      }

      assortmentProgress.update(i + 1);
    }
    assortmentProgress.complete();
  }

  // Final report
  stats.endTime = Date.now();
  const duration = formatDuration(stats.endTime - stats.startTime);

  logSection('Final Report');
  console.log(`\nCompleted in ${duration}\n`);

  if (!options.dryRun) {
    console.log('Import Results:');
    console.log(`  Filters:     ${stats.filters.sent}/${stats.filters.total} sent`);
    console.log(`  Products:    ${stats.products.sent}/${stats.products.total} sent`);
    console.log(`  Assortments: ${stats.assortments.sent}/${stats.assortments.total} sent`);

    const totalFailed = stats.filters.failed + stats.products.failed + stats.assortments.failed;
    if (totalFailed > 0) {
      console.log(`\n  Failed: ${totalFailed} events`);
    }
  } else {
    console.log('Dry run completed. No data was sent to the API.');
    if (options.output) {
      console.log(`Output written to: ${options.output}`);
    }
  }

  console.log('\n========================================\n');
}
