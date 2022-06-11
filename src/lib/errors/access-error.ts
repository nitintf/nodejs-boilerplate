import { HTTP_FORBIDDEN } from 'app/lib/constants/http';
import { CustomError } from './custom-error';

export class AccessError extends CustomError {
  constructor(message: string, errorCode = HTTP_FORBIDDEN) {
    super(message, errorCode);
  }
}
