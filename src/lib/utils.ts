import { Request } from 'express';
import crypto from 'crypto';

export const getAuthParamsFromRequest = (req: Request) => {
  const { authorization }: any = req.headers;
  const authParts = authorization ? authorization.split(' ') : [];
  const token = authParts.pop();
  const scheme = authParts.pop();

  return { scheme, token };
};

export const makeShaHash = (data: string) =>
  crypto.createHash('sha256').update(data, 'utf8').digest('hex');

export function sleep(delay: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(undefined), delay);
  });
}

export async function exponentialBackoffWithJitter(attempt: number, capMs = 5000, baseMs = 1000) {
  await sleep(Math.min(capMs, baseMs * 2 ** attempt) * Math.random());
}

export const base64Encode = (value: string) => Buffer.from(value).toString('base64');
export const base64Decode = (value: string) => Buffer.from(value, 'base64').toString();

export function deserializeBoolean(value?: string) {
  return value != null ? (value === 'true' ? true : false) : undefined;
}
