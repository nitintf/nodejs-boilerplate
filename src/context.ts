import { ServiceContext, SERVICE_NAME, SERVICE_NAMESPACE } from 'app/types';
import * as environment from 'app/lib/enviorment';
import createLogger from 'app/lib/logger';
import createTracer from 'app/lib/tracer';
import Models from 'app/models';
import PagerDutyClient from 'app/lib/pager-duty';
import BackgroundJobRunner from 'app/lib/background-job-runner';
import http from 'http';
import { createTerminus, HealthCheckMap, TerminusOptions } from '@godaddy/terminus';
import { sleep } from 'app/lib/utils';
import { MS_PER_SECOND } from 'app/lib/constants/time';

// Graceful shutdown sequence:
// - K8s marks the pod as termitating and begins removing it from load balancing.
// - K8s sends the pod SIGTERM.
// - Pod receives SIGTERM and begins failing health probes.
// - Close all pubsub subscriptions.
// - Wait a few seconds for connections to be drained and pubsub handlers to complete.
// - Server shutdown waits for in-flight requests to complete then exits the process.
// - K8s sends SIGKILL if shutdown has stalled.
export const setupGracefulShutdown = (
  context: ServiceContext,
  server: http.Server,
  healthChecks: HealthCheckMap,
) => {
  const terminusOptions: TerminusOptions = {
    onSignal: async () => {
      context.logger.info('Beginning graceful shutdown.');
    },
    healthChecks,
    beforeShutdown: async () => {
      await sleep(10 * MS_PER_SECOND);
    },
    onShutdown: async () => {
      context.logger.info('Graceful shutdown complete.');
    },
    // Just wait for k8s to send SIGKILL instead of timing out here.
    timeout: Infinity,
    logger: context.logger.warn,
  };

  createTerminus(server, terminusOptions);
};

export const initContext = async (): Promise<ServiceContext> => {
  const env = environment.getString(process.env, 'ENVIRONMENT');
  const inGcp = environment.getBoolean(process.env, 'IN_GCP', true);
  const hostIp = environment.getString(process.env, 'HOST_IP', '');

  // Configure logging.
  const logLevel = environment.getString(process.env, 'LOG_LEVEL', 'info');
  const logger = createLogger(SERVICE_NAME, logLevel);

  // Set up last resort error handlers.
  // If an error reaches this point, just kill the server.
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception.', {
      error,
    });

    process.exit(1);
  });

  process.on('unhandledRejection', (error, promise) => {
    logger.error('Unhandled promise rejection.', {
      error,
      promise,
    });

    process.exit(1);
  });

  // Configure tracing as soon as possible.
  const tracer = createTracer({
    serviceName: SERVICE_NAME,
    namespace: SERVICE_NAMESPACE,
    hostIp,
    enabled: inGcp,
    env,
  });

  // Configure database connection.
  const dbUrl = environment.getString(process.env, 'LOCAL_DB_URL');
  const models = new Models(logger, dbUrl);

  await models.waitForConnection();

  // init PagerDutyClient - TODO: only in prod
  const pagerDutyClient = new PagerDutyClient();

  // // Configure GCP PubSub client.
  // const gcpProjectId = environment.getString(process.env, 'GCP_PROJECT_ID');
  // const gcpSaCredentials = JSON.parse(
  //   environment.getString(process.env, 'FLEET_OPS_GCP_SA_CREDENTIALS'),
  // );
  // const basePubSubClient = new PubSub({
  //   projectId: gcpProjectId,
  //   credentials: gcpSaCredentials,
  // });
  // const cloudPubSubClient = new CloudPubSubClient(logger, basePubSubClient);

  // const cloudStorageClient = new Storage({
  //   projectId: gcpProjectId,
  //   credentials: gcpSaCredentials,
  // });
  // const cloudStorageBucketName = environment.getString(process.env, 'MIDAS_GCS_BUCKET');

  // const bigQueryClient = new BigQuery({
  //   projectId: gcpProjectId,
  //   credentials: gcpSaCredentials,
  // });

  const backgroundJobRunner = new BackgroundJobRunner();

  return {
    logger,
    backgroundJobRunner,
    models,
    pagerDutyClient,
    tracer,
  };
};
