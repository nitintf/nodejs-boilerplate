import ddtrace, { Span } from 'dd-trace';

interface TracerOptions {
  namespace: string;
  serviceName: string;
  hostIp: string;
  enabled: boolean;
  env: string;
}

// const PROFILING_ENABLED = process.env.PROFILING_ENABLED === 'true';

export function addTags(span: Span | undefined, tags: Record<string, string>) {
  if (span) {
    span.addTags(tags);
  }
}

export default function createTracer({ namespace, serviceName, hostIp, env }: TracerOptions) {
  // TODO: Change back to using `profiling` option when re-enabled as non-experimental option.
  // See https://github.com/DataDog/dd-trace-js/pull/1098
  // process.env.DD_EXPERIMENTAL_PROFILING_ENABLED = PROFILING_ENABLED.toString();
  const tracer = ddtrace.init({
    hostname: hostIp,
    service: serviceName,
    env,
    tags: {
      namespace,
    },
  });

  tracer.use('express', { service: serviceName });
  tracer.use('http', { service: serviceName });
  tracer.use('pg', { service: serviceName });
  tracer.use('grpc', { service: serviceName });

  return tracer;
}
