// import tracer from 'dd-trace';
// import fs from 'fs';
// import { decycle } from 'json-decycle';
import { Logger, LoggerInstance, transports } from 'winston';

export default function createLogger(serviceName: string, level = 'info'): LoggerInstance {
  const logger = new Logger({
    level,
    transports: [
      new transports.Console({
        colorize: true,
        debugStdout: true,
        handleExceptions: true,
        json: false,
        stringify: ({ message, level }: any) => {
          let severity = level;

          // const span = tracer.scope().active();

          const logLine: any = {
            serviceContext: { service: serviceName },
            time: new Date().toISOString(),
            severity,
            message,
            // traceId: span?.context().toTraceId(),
          };

          return JSON.stringify(logLine);
        },
      }),
    ],
    exitOnError: false,
  });

  return logger;
}
