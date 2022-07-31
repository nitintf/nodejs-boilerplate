import Api from 'app/api';
// import createServiceAuthenticator from 'app/lib/authn/service-auth';
import Gateway from 'app/lib/gateway';
import { ServiceContext } from 'app/types';

interface ServiceOptions {
  context: ServiceContext;
  inGcp: boolean;
}

export default function createService({ context, inGcp }: ServiceOptions) {
  const api = new Api(context);

  const gateway = new Gateway({
    logger: context.logger,
    returnStackTrace: !inGcp,
  });

  // const serviceAuthn = createServiceAuthenticator();

  return gateway.setupRoutes([
    {
      handler: api.createUser.bind(api),
      method: 'POST',
      path: '/user',
    },
  ]);
}
