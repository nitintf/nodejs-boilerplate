import { Request, Response } from 'express';

type ServiceAccountAuthenticator = (
  req: Request,
  res: Response,
  token: string,
  scope?: string,
) => Promise<void>;

export default function createServiceAuthenticator(): ServiceAccountAuthenticator {
  return async () => {};
}
