import { HTTP_INTERNAL_SERVER_ERROR } from 'app/lib/constants/http';
import { CustomError } from './custom-error';

export class internalServerError extends CustomError {
  constructor(message: string, errorCode = HTTP_INTERNAL_SERVER_ERROR) {
    super(message, errorCode);
  }
}
