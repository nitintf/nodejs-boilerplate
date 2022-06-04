import { HTTP_REQUEST_TIMEOUT } from 'nodejs-boilerplate/lib/constants/http';
import { CustomError } from './custom-error';

export class RequestTimeoutError extends CustomError {
  constructor(message: string) {
    super(message, HTTP_REQUEST_TIMEOUT);
  }
}
