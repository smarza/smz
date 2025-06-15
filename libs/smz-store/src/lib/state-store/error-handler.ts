import { ScopedLogger } from '@smz-ui/core';

export interface StoreError extends Error {
  storeName: string;
  timestamp: string;
  originalError: unknown;
  [key: string]: unknown;
}

export function createStoreError(
  error: unknown,
  storeName: string,
  logger: ScopedLogger
): StoreError {
  // Ensure we have a valid error object
  const baseError = new Error() as StoreError;

  baseError.originalError = error;

  // Safely extract message
  try {
    if (error instanceof Error) {
      baseError.message = error.message;
      baseError.name = error.name;
      baseError.stack = error.stack;
    } else if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      baseError.message = String(errorObj['message'] ?? error);
      baseError.name = String(errorObj['name'] ?? 'Error');
      baseError.stack = String(errorObj['stack'] ?? '');
    } else {
      baseError.message = String(error);
      baseError.name = 'Error';
    }
  } catch {
    baseError.message = 'Failed to extract error message';
    baseError.name = 'Error';
  }

  // Add store context safely
  try {
    Object.defineProperties(baseError, {
      storeName: {
        value: storeName,
        enumerable: true,
        configurable: true
      },
      timestamp: {
        value: new Date().toISOString(),
        enumerable: true,
        configurable: true
      },
      originalError: {
        value: error,
        enumerable: true,
        configurable: true
      }
    });
  } catch (contextError) {
    logger.error('Failed to add context to error:', contextError);
  }

  // Safely copy additional properties
  if (error && typeof error === 'object') {
    try {
      const safeProps = Object.entries(error as Record<string, unknown>).reduce((acc, [key, value]) => {
        // Skip standard Error properties and non-serializable values
        if (
          !['message', 'name', 'stack'].includes(key) &&
          value !== undefined &&
          value !== null &&
          typeof value !== 'function' &&
          typeof value !== 'symbol'
        ) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);

      Object.entries(safeProps).forEach(([key, value]) => {
        try {
          Object.defineProperty(baseError, key, {
            value,
            enumerable: true,
            configurable: true
          });
        } catch (propError) {
          logger.warn(`Failed to copy error property ${key}:`, propError);
        }
      });
    } catch (propsError) {
      logger.error('Failed to copy error properties:', propsError);
    }
  }

  // Safe logging
  try {
    const logInfo = {
      name: baseError.name,
      message: baseError.message,
      storeName: baseError.storeName,
      timestamp: baseError.timestamp
    };

    // Only log additional properties if they exist
    const details = Object.getOwnPropertyNames(baseError)
      .filter(prop => !['name', 'message', 'stack', 'storeName', 'timestamp', 'originalError'].includes(prop))
      .reduce((acc, prop) => {
        acc[prop] = baseError[prop];
        return acc;
      }, {} as Record<string, unknown>);

    if (Object.keys(details).length > 0) {
      Object.assign(logInfo, { details });
    }

    logger.error('Wrapped error:', logInfo);
  } catch (logError) {
    logger.error('Failed to log error:', logError);
  }

  // Create a new error with all properties properly attached
  const finalError = new Error(baseError.message) as StoreError;

  // Set all properties using Object.defineProperty to ensure they are enumerable
  Object.defineProperties(finalError, {
    name: { value: baseError.name, enumerable: true },
    stack: { value: baseError.stack, enumerable: true },
    storeName: { value: baseError.storeName, enumerable: true },
    timestamp: { value: baseError.timestamp, enumerable: true },
    originalError: { value: baseError.originalError, enumerable: true }
  });

  // Copy all additional properties
  Object.getOwnPropertyNames(baseError).forEach(prop => {
    if (!['name', 'message', 'stack', 'storeName', 'timestamp', 'originalError'].includes(prop)) {
      Object.defineProperty(finalError, prop, {
        value: baseError[prop],
        enumerable: true,
        configurable: true
      });
    }
  });

  return {
    ...finalError,
    message: finalError.message,
    name: finalError.name,
    stack: finalError.stack,
    storeName: finalError.storeName,
    timestamp: finalError.timestamp,
    originalError: finalError.originalError
  };
}