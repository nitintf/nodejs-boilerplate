import MidasApi from 'nodejs-boilerplate/api';
import createServiceAuthenticator from 'nodejs-boilerplate/lib/authn/service-auth';
import Gateway from 'nodejs-boilerplate/lib/gateway';
import { ServiceContext } from 'nodejs-boilerplate/types';

interface ServiceOptions {
  context: ServiceContext;
  inGcp: boolean;
}

export default function createService({ context, inGcp }: ServiceOptions) {
  const api = new MidasApi(context);

  const gateway = new Gateway({
    logger: context.logger,
    returnStackTrace: !inGcp,
  });

  const serviceAuthn = createServiceAuthenticator();

  gateway.addSubRouter('/', []);

  return gateway.setupRoutes(
    [
      {
        handler: api.getUsers.bind(api),
        method: 'GET',
        path: '/',
        authn: {
          jwtAuth: serviceAuthn,
        },
      },
    ],
    '/nitin',
  );
}
