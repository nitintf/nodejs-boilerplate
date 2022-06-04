import { Request, Response } from 'express';
import { LeveledLogMethod } from 'winston';
import {
  HTTP_BAD_REQUEST,
  HTTP_FORBIDDEN,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_NOT_FOUND,
} from 'nodejs-boilerplate/lib/constants/http';
import {
  AccessError,
  CustomError,
  NotFoundError,
  ValidationError,
} from 'nodejs-boilerplate/lib/errors';

export function formatErrorResponse(error: any) {
  return { error: error.details || error.message };
}

export default class BaseMidasApi {
  protected context: any;

  constructor(context: any) {
    this.context = context;
  }

  public createContext(res?: Response) {
    return Object.assign({}, this.context, {
      userId: res?.locals?.userId,
      userEmail: res?.locals?.userEmail,
      userType: res?.locals?.userType,
      requestId: res?.locals?.requestId,
    });
  }

  public handleError(req: Request, res: Response, error: any, message: string) {
    let status;

    let logMethod: LeveledLogMethod = this.context.logger.error;

    if (error instanceof ValidationError) {
      status = HTTP_BAD_REQUEST;
      logMethod = this.context.logger.warn;
    } else if (error instanceof AccessError) {
      status = HTTP_FORBIDDEN;
      logMethod = this.context.logger.info;
    } else if (error instanceof NotFoundError) {
      status = HTTP_NOT_FOUND;
      logMethod = this.context.logger.info;
    } else if (error instanceof CustomError) {
      status = error.errorCode;
      logMethod = this.context.logger.error;
    } else {
      status = HTTP_INTERNAL_SERVER_ERROR;
      logMethod = this.context.logger.error;
    }

    // NOTE: DO NOT LOG THE REQUEST HEADERS! IT CONTAINS CREDENTIALS.
    // TODO: consider removing request info as we'll log it in final middleware
    logMethod(message, { error, body: req.body, params: req.params });
    res.status(status).send(formatErrorResponse(error));
  }
}
