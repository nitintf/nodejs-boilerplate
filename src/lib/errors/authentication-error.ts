import { HTTP_UNAUTHORIZED } from 'nodejs-boilerplate/lib/constants/http';
import { CustomError } from './custom-error';

export class AuthenticationError extends CustomError {
  constructor(message: string) {
    super(message, HTTP_UNAUTHORIZED);
  }
}
