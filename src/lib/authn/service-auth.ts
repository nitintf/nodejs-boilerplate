import { Request, Response } from 'express';

type ServiceAccountAuthenticator = (
  req: Request,
  res: Response,
  token: string,
  scope?: string,
) => Promise<boolean>;

export default function createServiceAuthenticator(): ServiceAccountAuthenticator {
  return async () => {
    return false;
  };
}
