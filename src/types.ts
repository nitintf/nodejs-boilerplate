import PagerDutyClient from 'nodejs-boilerplate/lib/pager-duty';
import { LoggerInstance } from 'winston';
import { Tracer } from 'dd-trace';
import BackgroundJobRunner from 'nodejs-boilerplate/lib/background-job-runner';
import Models from 'nodejs-boilerplate/models';

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
