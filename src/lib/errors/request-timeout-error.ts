import { HTTP_REQUEST_TIMEOUT } from 'app/lib/constants/http';
import { CustomError } from './custom-error';

export class RequestTimeoutError extends CustomError {
  constructor(message: string) {
    super(message, HTTP_REQUEST_TIMEOUT);
  }
}
