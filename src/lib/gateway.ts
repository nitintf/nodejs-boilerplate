import { LoggerInstance } from 'winston';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import compression from 'compression';
import { v4 as uuidV4 } from 'uuid';
import { getAuthParamsFromRequest, makeShaHash } from 'nodejs-boilerplate/lib/utils';
import { HTTP_INTERNAL_SERVER_ERROR } from 'nodejs-boilerplate/lib/constants/http';
import {
  AccessError,
  AuthenticationError,
  extractErrorCode,
  extractErrorMessage,
} from 'nodejs-boilerplate/lib/errors';

interface RouteAuthn {
  serviceAuthenticator: any;
  // serviceAccount?: ServiceAccountAuthenticator;
  // oauth?: OAuthAuthenticator;
}

export interface Route {
  method: string;
  path: string;
  handler: (req: Request, res: Response) => void | Promise<void>;
  authn?: RouteAuthn;
  scope?: string;
  compression?: boolean;
}

interface GatewayOptions {
  logger: LoggerInstance;
  returnStackTrace: boolean;
}

export default class Gateway {
  private logger: LoggerInstance;
  private express: express.Application;
  private returnStackTrace: boolean;

  constructor({ logger, returnStackTrace }: GatewayOptions) {
    this.logger = logger;
    this.express = express();
    this.returnStackTrace = returnStackTrace;

    this.express.set('trust proxy', 1);
    this.express.use(express.json({ limit: '30mb' }));
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use(express.text());
    this.express.use(cors());
    this.express.use((_req, res, next) => {
      res.locals.requestId = uuidV4();
      res.locals.startTime = new Date();
      next();
    });
  }

  public addSubRouter(path = '/', routes: Route[]) {
    this.setupRoutes(routes, path);
  }

  public setupRoutes(input: Route[], basePath = '/') {
    const routes = input;
    const router = express.Router();

    routes.forEach((route) => {
      const routePath = route.path;
      const formattedPath = path.join(basePath, route.path);
      const handler = this.wrapRouteHandler(route, formattedPath);
      const args: any[] = [routePath];

      if (route.compression) {
        args.push(compression());
      }

      args.push(handler);

      this.logger.info(`route method=${route.method} path=${formattedPath}`);

      if (route.method) {
        (router as any)[route.method.toLowerCase()](...args);
      } else {
        router.all(`${routePath}*`, handler);
      }
    });

    this.express.use(basePath, router);

    return this.express;
  }

  private logHTTPRequest(path: string, request: Request, response: Response) {
    const { userId, userEmail, userType, startTime } = response.locals;
    const { method, body, query, params } = request;

    let latency;
    if (startTime) {
      latency = Date.now() - startTime;
    }

    const meta = {
      request: {
        method,
        body,
        query,
        params,
        path,
        userId,
        userEmail,
        userType,
      },
      response: {
        statusCode: response.statusCode,
        latency,
      },
    };

    this.logger.info('HTTP Request', meta);
  }

  private async authRequest(authn: RouteAuthn, req: Request, res: Response, scope?: string) {
    const { scheme, token } = getAuthParamsFromRequest(req);

    try {
      if (!token) {
        throw new AuthenticationError('Missing auth token.');
      }

      if (scheme === 'Bearer') {
        // authenticate with authn
        authn.serviceAuthenticator(req, res, scope);
      } else {
        throw new AuthenticationError('Invalid authentication type used.');
      }
    } catch (error) {
      this.logger.info(
        `Authentication failed. Scheme: ${scheme || ''}. Token: ${
          token != null ? makeShaHash(token) : ''
        }.`,
        error,
      );

      throw error;
    }
  }

  private handleRouteAuthError = (error: Error, res: Response) => {
    const errorCode = extractErrorCode(error);

    if (error instanceof AuthenticationError) {
      this.logger.warn('Unauthorized request', error);
    } else if (error instanceof AccessError) {
      this.logger.warn('Forbidden request', error);
    } else {
      this.logger.error(`Route auth error (${errorCode})`, error);
    }
    res.status(errorCode).send({ error: extractErrorMessage(error) });
  };

  private wrapRouteHandler(route: Route, path: string) {
    const withAuth = this.wrapRouteHandlerWithAuth(route);

    return async (req: Request, res: Response) => {
      const ret = await withAuth(req, res);
      this.logHTTPRequest(path, req, res);
      return ret;
    };
  }

  private wrapRouteHandlerWithAuth(route: Route) {
    return async (req: Request, res: Response) => {
      try {
        if (route.authn) {
          return this.authRequest(route.authn, req, res, route.scope);
        }
      } catch (error: any) {
        this.handleRouteAuthError(error, res);
        return;
      }

      try {
        return await route.handler(req, res);
      } catch (error: any) {
        this.logger.error('route handler execution failed', error);

        const stacktrace = error.stack ? error.stack.toString() : '';
        const errorJson: any = { error: 'Server Error' };

        if (this.returnStackTrace) {
          errorJson.stacktrace = stacktrace;
        }

        res.locals.error = res.locals.error || stacktrace.substring(0, 255); // to be logged later
        return res.status(HTTP_INTERNAL_SERVER_ERROR).send(errorJson);
      }
    };
  }
}
