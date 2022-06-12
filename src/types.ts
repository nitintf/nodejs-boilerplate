import PagerDutyClient from 'app/lib/pager-duty';
import { LoggerInstance } from 'winston';
import { Tracer } from 'dd-trace';
import BackgroundJobRunner from 'app/lib/background-job-runner';
import Models from 'app/models';

export type Nullable<T> = T | null;
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };
export type $Values<O extends object> = O[keyof O];

export interface ServiceContext {
  models: Models;
  // cloudPubSubClient: any; // CloudPubSubClient;
  // cloudStorageClient: any; // Storage;
  // cloudStorageBucketName: string;
  logger: LoggerInstance;
  pagerDutyClient: PagerDutyClient;
  tracer: Tracer;
  backgroundJobRunner: BackgroundJobRunner;
  userId?: string;
}

export interface UserContext extends ServiceContext {
  userId: string;
  userEmail: string;
  userType: string;
  requestId?: string;
}

export const ENVIRONMENT = {
  LOCAL: 'local',
  TEST: 'test',
  DEV: 'dev',
  STAGING: 'staging',
  PROD: 'prod',
};

export const SERVICE_NAME = 'test';
export const SERVICE_NAMESPACE = 'product';

export const AUTH_USER_TYPE = {
  USER: 'user',
  ADMIN: 'admin',
};
