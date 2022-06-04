export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_CREATED_SUPPORT_GATEWAY = 204;
export const HTTP_ACCEPTED = 202;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_NOT_ACCEPTABLE = 406;
export const HTTP_UNPROCESSABLE_ENTITY = 422;
export const HTTP_INTERNAL_SERVER_ERROR = 500;
export const HTTP_NOT_IMPLEMENTED = 501;
export const HTTP_SERVICE_UNAVAILABLE = 503;
export const HTTP_REQUEST_TIMEOUT = 408;
export const HTTP_RATE_LIMIT_EXCEEDED = 429;

export const HTTP_CODE_TO_MESSAGE: {
  [key: number]: string;
} = {
  [HTTP_OK]: 'Ok',
  [HTTP_CREATED]: 'Created',
  [HTTP_ACCEPTED]: 'Accepted',
  [HTTP_BAD_REQUEST]: 'Bad request',
  [HTTP_UNAUTHORIZED]: 'Unauthorized',
  [HTTP_FORBIDDEN]: 'Forbidden',
  [HTTP_NOT_FOUND]: 'Not found',
  [HTTP_INTERNAL_SERVER_ERROR]: 'Internal server error',
  [HTTP_REQUEST_TIMEOUT]: 'Request timeout',
};
