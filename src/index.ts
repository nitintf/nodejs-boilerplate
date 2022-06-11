import http from 'http';
import { initContext, setupGracefulShutdown } from 'app/context';
import * as enviorment from 'app/lib/enviorment';
import createService from 'app/service';
import { MS_PER_SECOND } from 'app/lib/constants/time';

const PORT = 8080;

async function main() {
  // const env = enviorment.getString(process.env, 'ENVIRONMENT');
  const inGcp = enviorment.getBoolean(process.env, 'IN_GCP', true);
  const context = await initContext();

  const service = createService({
    context,
    inGcp,
  });

  const server = http.createServer(service);

  server.timeout = 30 * MS_PER_SECOND;

  server.listen(PORT, () => {
    context.logger.info(`Express server setup on ${PORT}.`);
  });

  setupGracefulShutdown(context, server, {
    '/_ready': async () => {
      return true;
    },
    '/_healthy': async () => {
      return true;
    },
  });
}

main();
