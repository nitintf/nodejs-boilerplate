import {
  HTTP_CODE_TO_MESSAGE,
  HTTP_FORBIDDEN,
  HTTP_INTERNAL_SERVER_ERROR,
} from 'app/lib/constants/http';

export * from './custom-error';
export * from './access-error';
export * from './authentication-error';
export * from './bad-request-error';
export * from './internal-server-error';
export * from './not-found-error';
export * from './request-timeout-error';
export * from './validation-error';

export const extractErrorCode = (error: any) =>
  (error && error.errorCode) || HTTP_INTERNAL_SERVER_ERROR;

export const extractErrorMessage = (error: any) =>
  error.message && error.errorCode === HTTP_FORBIDDEN
    ? error.message
    : HTTP_CODE_TO_MESSAGE[extractErrorCode(error)] || error.message;
