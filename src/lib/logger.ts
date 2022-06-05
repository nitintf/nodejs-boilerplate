import tracer from 'dd-trace';
import { decycle } from 'json-decycle';
import { Logger, LoggerInstance, transports } from 'winston';

const LOG_LENGTH_LIMIT = 1024 * 10; // 10 kilobyte limit on log length (per logged object)
const MINIMUM_LOG_LEVEL_FOR_DROPPED_METADATA = 'warn';

function sanitizeMetadata(meta: any) {
  if (meta && meta.toJSON) {
    meta = meta.toJSON();
  }

  let sanitized = meta;
  if (meta && meta instanceof Object) {
    sanitized = Object.entries(meta).reduce((acc, [key, val]) => {
      const size = val ? JSON.stringify(val).length : 0;
      if (size > LOG_LENGTH_LIMIT) {
        return {
          ...acc,
          [key]: {
            truncated: true,
            contextSize: size,
            logLengthLimit: LOG_LENGTH_LIMIT,
          },
        };
      }
      return {
        ...acc,
        [key]: val,
      };
    }, {});
  }

  return sanitized;
}

function getHigherLoggingLevel(logger: any, currentLevel: string, minimalLevel: string) {
  const currentLevelPriority = logger.levels[currentLevel];
  const minimalLevelPriority = logger.levels[minimalLevel];

  // Use the highest logging level (one with the lowest priority number)
  const level = currentLevelPriority < minimalLevelPriority ? currentLevel : minimalLevel;

  return level;
}

export default function createLogger(serviceName: string, level = 'info'): LoggerInstance {
  const logger = new Logger({
    level,
    transports: [
      new transports.Console({
        colorize: true,
        debugStdout: true,
        handleExceptions: true,
        json: true,
        stringify: ({ message, level, ...meta }: any) => {
          const sanitizedMeta = sanitizeMetadata(meta);
          const isSanitized = sanitizedMeta && sanitizedMeta.truncated;
          let severity = level;

          const span = tracer.scope().active();

          if (isSanitized) {
            severity = getHigherLoggingLevel(logger, level, MINIMUM_LOG_LEVEL_FOR_DROPPED_METADATA);
            message = `[DROPPED METADATA] ${message}`;
          }

          const logLine: any = {
            service: serviceName,
            time: new Date().toISOString(),
            severity,
            message,
            traceId: span?.context().toTraceId(),
            context: sanitizeMetadata,
          };

          return JSON.stringify(logLine, decycle());
        },
      }),
    ],
    exitOnError: false,
  });

  return logger;
}
