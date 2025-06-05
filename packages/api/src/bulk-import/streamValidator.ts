import { Readable, Transform } from 'stream';
import { createLogger } from '@unchainedshop/logger';
import JSONStream from 'JSONStream';
import { BulkImportEventSchema } from './schemas.js';

const logger = createLogger('unchained:bulk-import:validator');

export interface ValidationError {
  path: string[];
  message: string;
  code: string;
  eventIndex?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  eventsProcessed: number;
}

/**
 * Creates a transform stream that validates bulk import events in a streaming fashion
 */
export function createValidationStream(): Transform {
  let eventIndex = 0;
  const errors: ValidationError[] = [];

  const validationTransform = new Transform({
    objectMode: true,
    transform(chunk, _encoding, callback) {
      try {
        // Validate the event against the schema
        const result = BulkImportEventSchema.safeParse(chunk);
        
        if (!result.success) {
          // Extract validation errors
          result.error.errors.forEach((error) => {
            errors.push({
              path: error.path.map(String),
              message: error.message,
              code: error.code,
              eventIndex,
            });
          });
          
          logger.warn(`Validation failed for event ${eventIndex}:`, result.error.errors);
        } else {
          logger.debug(`Event ${eventIndex} validated successfully`);
        }

        eventIndex++;
        
        // Pass the chunk through regardless of validation
        // We want to collect all errors before deciding to fail
        callback(null, chunk);
      } catch (error) {
        errors.push({
          path: [],
          message: `Unexpected validation error: ${error.message}`,
          code: 'VALIDATION_ERROR',
          eventIndex,
        });
        callback(null, chunk);
      }
    },
    
    flush(callback) {
      // Emit validation result when stream ends
      this.emit('validation-result', {
        isValid: errors.length === 0,
        errors,
        eventsProcessed: eventIndex,
      });
      callback();
    }
  });

  return validationTransform;
}

/**
 * Validates a readable stream containing bulk import JSON data
 * @param readableStream - Stream containing JSON data with events array
 * @returns Promise<ValidationResult>
 */
export async function validateBulkImportStream(readableStream: Readable): Promise<ValidationResult> {
  return new Promise((resolve, reject) => {
    const validationTransform = createValidationStream();
    let validationResult: ValidationResult = {
      isValid: false,
      errors: [],
      eventsProcessed: 0,
    };

    // Parse JSON stream to extract events
    const jsonStream = JSONStream.parse('events.*');
    
    // Set up validation result handler
    validationTransform.on('validation-result', (result: ValidationResult) => {
      validationResult = result;
    });

    // Handle errors
    const handleError = (error: Error) => {
      logger.error('Stream validation error:', error);
      reject(new Error(`Stream validation failed: ${error.message}`));
    };

    jsonStream.on('error', handleError);
    validationTransform.on('error', handleError);
    readableStream.on('error', handleError);

    // Handle completion
    validationTransform.on('end', () => {
      resolve(validationResult);
    });

    // Pipe the streams together
    readableStream
      .pipe(jsonStream)
      .pipe(validationTransform)
      .resume(); // Important: consume the stream to trigger validation
  });
}

/**
 * Validates bulk import payload synchronously (for in-memory data)
 * @param payload - The bulk import payload object
 * @returns ValidationResult
 */
export function validateBulkImportPayload(payload: any): ValidationResult {
  const errors: ValidationError[] = [];
  let eventsProcessed = 0;

  try {
    // First validate the overall structure
    if (!payload || typeof payload !== 'object') {
      errors.push({
        path: [],
        message: 'Payload must be an object',
        code: 'INVALID_TYPE',
      });
      return { isValid: false, errors, eventsProcessed: 0 };
    }

    if (!Array.isArray(payload.events)) {
      errors.push({
        path: ['events'],
        message: 'Events must be an array',
        code: 'INVALID_TYPE',
      });
      return { isValid: false, errors, eventsProcessed: 0 };
    }

    if (payload.events.length === 0) {
      errors.push({
        path: ['events'],
        message: 'At least one event is required',
        code: 'TOO_SMALL',
      });
      return { isValid: false, errors, eventsProcessed: 0 };
    }

    // Validate each event
    payload.events.forEach((event: any, index: number) => {
      eventsProcessed++;
      const result = BulkImportEventSchema.safeParse(event);
      
      if (!result.success) {
        result.error.errors.forEach((error) => {
          errors.push({
            path: ['events', index.toString(), ...error.path.map(String)],
            message: error.message,
            code: error.code,
            eventIndex: index,
          });
        });
      }
    });

  } catch (error) {
    errors.push({
      path: [],
      message: `Unexpected validation error: ${error.message}`,
      code: 'VALIDATION_ERROR',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    eventsProcessed,
  };
}