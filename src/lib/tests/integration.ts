import Models from 'app/models';
import assert from 'assert';
import { v4 as uuid4 } from 'uuid';
import sinon, { SinonStubbedInstance, SinonStubbedMember, StubbableType } from 'sinon';
import { AUTH_USER_TYPE, Nullable, UserContext } from 'app/types';
import { Logger, LoggerInstance } from 'winston';
import { Tracer } from 'dd-trace';
import BackgroundJobRunner from 'app/lib/background-job-runner';
import Mocha from 'mocha';
import sequelizeFixtures from 'sequelize-fixtures';

assert.strictEqual(process.env.NODE_ENV, 'development');

const DB_TEARDOWN_RETRY_LIMIT = 3;
const DUMMY_EMAIL = 'dummy@gmail.com';
const DUMMY_USER_ID = '1234';

const formatTestTime = (totalTimeMs: number) => {
  const timeMs = totalTimeMs % 1000;
  const totalTimeSeconds = Math.floor(totalTimeMs / 1000);
  const timeSeconds = totalTimeSeconds % 60;
  const timeMinutes = Math.floor(totalTimeSeconds / 60);

  return `${timeMinutes}:${timeSeconds.toString().padStart(2, '0')}.${timeMs}`;
};

export interface IntegrationTestFixtures<T extends FixtureReturnType<any>> {
  records: T[];
}

export interface FixtureReturnType<T> {
  model: keyof Models;
  data: T;
}

const sandbox = sinon.createSandbox();

// See https://github.com/sinonjs/sinon/issues/1963#issuecomment-497349920
// for why SinonStubbedInstance alone is not sufficient
export type StubbedClass<T> = SinonStubbedInstance<T> & T;

export function createSinonStubInstance<T>(
  constructor: StubbableType<T>,
  overrides?: { [K in keyof T]?: SinonStubbedMember<T[K]> },
) {
  const stub = sinon.createStubInstance<T>(constructor, overrides);
  return stub as unknown as StubbedClass<T>;
}

interface StubbedContext extends UserContext {
  userEmail: string;
  userId: string;
  userType: string;
  requestId: string;
  models: Models;
  logger: StubbedClass<LoggerInstance>;
  tracer: StubbedClass<Tracer>;
  backgroundJobRunner: StubbedClass<BackgroundJobRunner>;
}

function createStubbedLogger(): StubbedClass<LoggerInstance> {
  const logger = {} as LoggerInstance;
  logger.info = sandbox.stub();
  logger.error = sandbox.stub();
  logger.warn = sandbox.stub();
  logger.debug = sandbox.stub();

  return logger as StubbedClass<LoggerInstance>;
}

declare module 'mocha' {
  export interface Context {
    context: StubbedContext;
  }
}

function wrapper<T extends FixtureReturnType<any>>(
  fixturesOrFn: Nullable<IntegrationTestFixtures<T>> | Function,
  fn?: Function,
) {
  let fixtures = fixturesOrFn;
  if (typeof fixturesOrFn === 'function') {
    fn = fixturesOrFn;
    fixtures = null;
  }

  const originalDate = Date;

  return function (this: Mocha.Suite) {
    this.timeout(50000);
    this.retries(0);
    let suiteStart: number;
    let beforeEachCurrentStart: number;
    let beforeEachTotalMs = 0;
    let afterEachCurrentStart: number;
    let afterEachTotalMs = 0;
    let models: Models;
    let logger: StubbedClass<LoggerInstance>;

    before(async function () {
      suiteStart = originalDate.now();

      this.sandbox = sandbox;

      logger = createStubbedLogger();

      if (!process.env.LOCAL_DB_URL) {
        throw new Error('LOCAL_DB_URL env missing!');
      }
      models = new Models(logger, process.env.LOCAL_DB_URL);

      this.loadFixtureRecords = async (fixtures: any[]) =>
        sequelizeFixtures.loadFixtures(fixtures, models);
    });

    beforeEach(async function () {
      beforeEachCurrentStart = originalDate.now();

      await models.truncate(DB_TEARDOWN_RETRY_LIMIT);

      if (fixtures) {
        this.fixtures = fixtures;

        if (typeof fixtures !== 'function' && fixtures.records) {
          await this.loadFixtureRecords(await Promise.all(fixtures.records));
        }
      }

      this.context = {
        userEmail: DUMMY_EMAIL,
        userId: DUMMY_USER_ID,
        userType: AUTH_USER_TYPE.USER,
        requestId: uuid4(),
        models,
        // Uncomment to enable application logger (TODO: get this working as a spy)
        // logger: createLogger('app-name', 'debug') as StubbedClass<LoggerInstance>,
        logger,
        tracer: createSinonStubInstance(Logger),
        backgroundJobRunner: createSinonStubInstance<BackgroundJobRunner>(BackgroundJobRunner),
      };
    });

    afterEach(async () => {
      afterEachCurrentStart = originalDate.now();

      sandbox.restore();
    });

    after(async () => {
      await models.close();
    });

    if (!fn) {
      throw new Error('No function passed to describeIntegrationTest!');
    }
    fn();

    beforeEach(() => {
      beforeEachTotalMs += originalDate.now() - beforeEachCurrentStart;
      // beforeEachCurrentStart = null;
    });

    afterEach(() => {
      afterEachTotalMs += originalDate.now() - afterEachCurrentStart;
      // afterEachCurrentStart = null;
    });

    after(() => {
      console.log('\ttotal beforeEach time:', formatTestTime(beforeEachTotalMs));
      console.log('\ttotal afterEach time:', formatTestTime(afterEachTotalMs));
      console.log('\ttotal suite time:', formatTestTime(originalDate.now() - suiteStart));
    });
  };
}

export const describeIntegrationTest = <T extends FixtureReturnType<any>>(
  name: string,
  fixtures: Nullable<IntegrationTestFixtures<T> | Function>,
  fn?: Function,
) => {
  describe(name, wrapper(fixtures, fn));
};

describeIntegrationTest.only = <T extends FixtureReturnType<any>>(
  name: string,
  fixtures: Nullable<IntegrationTestFixtures<T> | Function>,
  fn?: Function,
) => {
  describe.only(name, wrapper(fixtures, fn));
};

describeIntegrationTest.skip = <T extends FixtureReturnType<any>>(
  name: string,
  fixtures: Nullable<IntegrationTestFixtures<T> | Function>,
  fn?: Function,
) => {
  describe.skip(name, wrapper(fixtures, fn));
};
