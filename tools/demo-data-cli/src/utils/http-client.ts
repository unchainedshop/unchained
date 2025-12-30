// HTTP client for bulk-import API communication

import type { BulkImportPayload } from '../types/bulk-import.js';

export interface HttpClientConfig {
  endpoint: string;
  token: string;
  verbose?: boolean;
}

export interface ImportResult {
  success: boolean;
  workId?: string;
  error?: string;
  eventsCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendBulkImport(
  payload: BulkImportPayload,
  config: HttpClientConfig,
): Promise<ImportResult> {
  const url = `${config.endpoint}?createShouldUpsertIfIDExists=true`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (config.verbose) {
        console.log(`  Sending ${payload.events.length} events (attempt ${attempt}/${MAX_RETRIES})...`);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = (await response.json()) as { _id?: string };

      return {
        success: true,
        workId: result._id,
        eventsCount: payload.events.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (attempt === MAX_RETRIES) {
        return {
          success: false,
          error: errorMessage,
          eventsCount: payload.events.length,
        };
      }

      if (config.verbose) {
        console.log(`  Retry ${attempt}/${MAX_RETRIES} after error: ${errorMessage}`);
      }

      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  return {
    success: false,
    error: 'Max retries exceeded',
    eventsCount: payload.events.length,
  };
}
