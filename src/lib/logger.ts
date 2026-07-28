import pino from 'pino';

// Log levels
type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

// Log context interface
interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

// Create a request ID generator
let requestCounter = 0;
function generateRequestId(): string {
  return `req_${Date.now()}_${++requestCounter}`;
}

// Determine log level based on environment
const getLogLevel = (): LogLevel => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.LOG_LEVEL as LogLevel || 'info';
  }
  return process.env.LOG_LEVEL as LogLevel || 'debug';
};

// Create the main logger
const logger = pino({
  level: getLogLevel(),
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => {
      const { level, time, msg, ...rest } = object;
      return {
        timestamp: typeof time === 'number' ? new Date(time).toISOString() : String(time),
        level,
        message: msg,
        ...rest,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        userAgent: req.headers['user-agent'],
      },
    }),
    res: (res) => ({
      status: res.statusCode,
    }),
    err: (err) => ({
      type: err.name,
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    }),
  },
});

// Create a child logger with request context
function createRequestLogger(context: LogContext = {}) {
  const requestId = context.requestId || generateRequestId();
  return logger.child({
    requestId,
    ...context,
  });
}

// Main logger functions
export const log = {
  // Create a logger for a specific request
  forRequest: (context: LogContext = {}) => createRequestLogger(context),

  // Direct logging methods (for non-request contexts)
  fatal: (message: string, context?: LogContext) => {
    logger.fatal(context, message);
  },
  error: (message: string, context?: LogContext) => {
    logger.error(context, message);
  },
  warn: (message: string, context?: LogContext) => {
    logger.warn(context, message);
  },
  info: (message: string, context?: LogContext) => {
    logger.info(context, message);
  },
  debug: (message: string, context?: LogContext) => {
    logger.debug(context, message);
  },
  trace: (message: string, context?: LogContext) => {
    logger.trace(context, message);
  },
};

// Audit logger for security-sensitive actions
const auditLog = pino({
  level: 'info',
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => {
      const { level, time, msg, ...rest } = object;
      return {
        timestamp: typeof time === 'number' ? new Date(time).toISOString() : String(time),
        level,
        message: msg,
        action: rest.action,
        ...rest,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Audit log function for security events
export function logAuditEvent(
  action: string,
  context: {
    userId?: string;
    userRole?: string;
    ip?: string;
    userAgent?: string;
    targetId?: string;
    targetType?: string;
    oldValue?: unknown;
    newValue?: unknown;
    status?: 'success' | 'failure';
    error?: string;
  } = {}
) {
  auditLog.info(
    {
      action,
      ...context,
    },
    `Audit: ${action}`
  );
}

// Database query logger (for debugging)
const dbLog = pino({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => {
      const { level, time, msg, ...rest } = object;
      return {
        timestamp: typeof time === 'number' ? new Date(time).toISOString() : String(time),
        level,
        message: msg,
        ...rest,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Performance logger
const perfLog = pino({
  level: 'info',
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => {
      const { level, time, msg, duration, ...rest } = object;
      return {
        timestamp: typeof time === 'number' ? new Date(time).toISOString() : String(time),
        level,
        message: msg,
        durationMs: duration,
        ...rest,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Measure execution time
export function measureTime<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> | T {
  const start = Date.now();
  
  if (typeof fn === 'function') {
    return (async () => {
      try {
        const result = await (fn as () => Promise<T>)();
        const duration = Date.now() - start;
        perfLog.info({ duration, name }, `Performance: ${name}`);
        return result;
      } catch (err) {
        const duration = Date.now() - start;
        perfLog.error({ duration, name, error: err }, `Performance: ${name} failed`);
        throw err;
      }
    })();
  } else {
    const result = fn as T;
    const duration = Date.now() - start;
    perfLog.info({ duration, name }, `Performance: ${name}`);
    return result;
  }
}

// Error handler that logs errors consistently
export function handleError(
  error: unknown,
  context: {
    message?: string;
    requestId?: string;
    userId?: string;
    statusCode?: number;
  } = {}
): { error: string; statusCode: number } {
  const { message, requestId, userId, statusCode = 500 } = context;
  
  const errorObj = error as Error;
  const errorMessage = message || errorObj.message || 'Internal server error';
  const errorStack = process.env.NODE_ENV !== 'production' ? errorObj.stack : undefined;

  log.error(errorMessage, {
    requestId,
    userId,
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorStack,
    },
  });

  return {
    error: errorMessage,
    statusCode,
  };
}

// Middleware for logging API requests
export function createLoggingMiddleware(getRequestId: () => string = generateRequestId) {
  return {
    startRequest: (context: LogContext = {}) => {
      const requestId = getRequestId();
      const requestLogger = createRequestLogger({ ...context, requestId });
      
      requestLogger.info('Request started');
      
  return {
    requestId,
    requestLogger,
    logError: (error: unknown, additionalContext?: LogContext) => {
      requestLogger.error({
        ...additionalContext,
        error: error as Error,
        status: 'failed',
      }, 'Request failed');
    },
    logSuccess: (additionalContext?: LogContext) => {
      requestLogger.info({
        ...additionalContext,
        status: 'success',
      }, 'Request completed');
    },
  };
    },
  };
}

// Export the main logger for direct use
export { logger, auditLog, dbLog, perfLog };
