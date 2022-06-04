import { HTTP_BAD_REQUEST } from 'nodejs-boilerplate/lib/constants/http';
import { CustomError } from './custom-error';

export class BadRequestError extends CustomError {
  constructor(message: string, errorCode = HTTP_BAD_REQUEST) {
    super(message, errorCode);
  }
}
