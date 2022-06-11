import { HTTP_NOT_FOUND } from 'app/lib/constants/http';
import { CustomError } from './custom-error';

export class NotFoundError extends CustomError {
  constructor(message = 'Not Found') {
    super(message, HTTP_NOT_FOUND);
  }
}
