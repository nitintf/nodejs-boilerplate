import sequelize, {
  Sequelize,
  Transaction,
  DatabaseError,
  QueryTypes,
  TransactionIsolationLevel,
} from 'sequelize';
import { LoggerInstance } from 'winston';
import sequelizeTransforms from 'sequelize-transforms';
import { snakeCase } from 'change-case';
import format from 'pg-format';
import userModelFactory, { User } from './user';
import listModelFactory, { List } from './list';
import * as environment from 'app/lib/enviorment';
import { exponentialBackoffWithJitter } from 'app/lib/utils';

const TRANSACTION_RETRY_LIMIT = 4;
const DB_STATEMENT_TIMEOUT = environment.getNumber(process.env, 'DB_STATEMENT_TIMEOUT', 0);
const DB_LOCK_TIMEOUT = environment.getNumber(process.env, 'DB_LOCK_TIMEOUT', 0);

interface ModelOptions {
  dbPoolMin?: number;
  dbPoolMax?: number;
  dbPoolMaxIdleMs?: number;
  dbPoolMaxAcquireMs?: number;
  logSql?: boolean;
}

export function getTableName(model: any) {
  const tableName = model.getTableName();

  return typeof tableName === 'string' ? tableName : `${tableName.schema}.${tableName.table}`;
}

export default class Models {
  public sequelize: Sequelize;
  public tableNames: string[];

  public User: User;
  public List: List;

  private logger: LoggerInstance;
  private url: string;

  constructor(
    logger: LoggerInstance,
    url: string,
    {
      dbPoolMin = 1,
      dbPoolMax = 25, // cloudsql max for total (across all pods) is 600
      dbPoolMaxIdleMs = 10000,
      dbPoolMaxAcquireMs = 20000,
      logSql = false,
    }: ModelOptions = {},
  ) {
    this.logger = logger;
    this.url = url;

    const tableNames = [];

    const dbOptions: sequelize.Options = {
      logging: logSql ? (sql: string) => logger.debug(sql) : false,
      benchmark: logSql,
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      pool: {
        min: dbPoolMin,
        max: dbPoolMax,
        idle: dbPoolMaxIdleMs,
        acquire: dbPoolMaxAcquireMs,
      },
      dialectOptions: {
        lock_timeout: DB_LOCK_TIMEOUT,
        statement_timeout: DB_STATEMENT_TIMEOUT,
      },
    };

    const sequelize = new Sequelize(url, dbOptions);

    sequelizeTransforms(sequelize, {
      snakeCase(val: string) {
        return val ? snakeCase(val.toString().trim()) : val;
      },
    });

    this.User = userModelFactory(sequelize);
    tableNames.push(getTableName(this.User));

    this.List = listModelFactory(sequelize);
    tableNames.push(getTableName(this.List));

    this.sequelize = sequelize;
    this.tableNames = tableNames;

    // TODO: add associationa nd hooks logic

    const models = sequelize.models;

    for (const model of Object.values(models)) {
      if (model.associate) {
        model.associate(models);
      }

      // @ts-ignore
      if (model.hooks) {
        // @ts-ignore
        model.hooks(this);
      }
    }
  }

  public async checkConnection() {
    // https://sequelize.org/master/manual/getting-started.html#testing-the-connection
    await this.sequelize.authenticate();
    this.logger.info('Sequelize connection ok');
  }

  public async waitForConnection() {
    for (let retryCount = 0; retryCount < 10; retryCount++) {
      try {
        await this.checkConnection();
        return;
      } catch (error) {
        this.logger.warn('Sequelize not connected, retrying...', error);
        await exponentialBackoffWithJitter(retryCount);
      }
    }

    throw new Error('Sequelize could not connect to the database');
  }

  public async close() {
    await this.sequelize.close();

    this.logger.info('Closed sequelize connectionpool');
  }

  public getUrl() {
    return this.url;
  }

  public async serializableTransaction<T>(
    userId: string | undefined,
    userEmail: string | undefined,
    userType: string | undefined,
    cb: (transaction: Transaction) => Promise<T>,
    retryCount = 0,
    retry = true,
    maxRetry = TRANSACTION_RETRY_LIMIT,
  ): Promise<T> {
    return this.customTransaction(
      userId,
      userEmail,
      userType,
      cb,
      retryCount,
      retry,
      maxRetry,
      Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    );
  }

  public async customTransaction<T>(
    userId: string | undefined,
    userEmail: string | undefined,
    userType: string | undefined,
    cb: (transaction: Transaction) => Promise<T>,
    retryCount = 0,
    retry = true,
    maxRetry = TRANSACTION_RETRY_LIMIT,
    isolationLevel: TransactionIsolationLevel,
  ): Promise<T> {
    try {
      const isolationLevelRequiresRetries =
        isolationLevel === Transaction.ISOLATION_LEVELS.REPEATABLE_READ ||
        isolationLevel === Transaction.ISOLATION_LEVELS.SERIALIZABLE;

      if (isolationLevelRequiresRetries && retry === false) {
        this.logger.warn(
          `Isolation level for transaction is: '${isolationLevel}' and retry functionality is disabled. It is highly recommended to have transactions of this isolation level retry, or failures are more likely to occur.`,
        );
      }

      const result = await this.sequelize.transaction(
        {
          isolationLevel,
        },
        async (transaction) => {
          if (userId && userEmail) {
            await this.sequelize.query(
              `
            SET LOCAL audit.userId = :userId;
            SET LOCAL audit.userEmail = :userEmail;
            SET LOCAL audit.userType = :userType;
            `,
              {
                replacements: {
                  userId,
                  userEmail,
                  userType,
                },
                transaction,
              },
            );
          }

          return cb(transaction);
        },
      );

      return result;
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        // @ts-ignore
        error.parent &&
        // 40001 is the error code for serialization failures.
        // @ts-ignore
        (error.parent.code === '40001' ||
          // 40P01 is the error code for deadlock detected.
          // @ts-ignore
          error.parent.code === '40P01')
      ) {
        if (retryCount < maxRetry && retry) {
          this.logger.info('Retrying transaction due to serialization.', { retryCount, error });

          await exponentialBackoffWithJitter(retryCount);

          return this.customTransaction(
            userId,
            userEmail,
            userType,
            cb,
            retryCount + 1,
            retry,
            maxRetry,
            isolationLevel,
          );
        } else {
          this.logger.error('Transaction failed too many times..', {
            error,
            retryCount,
          });
        }
      }

      throw error;
    }
  }

  public async truncate(retryLimit = 0, retryCount = 0) {
    try {
      await this.sequelize.query(
        format(
          `
            TRUNCATE %s CASCADE;
          `,
          this.tableNames.join(','),
        ),
        { type: QueryTypes.BULKDELETE },
      );
    } catch (error: any) {
      if (retryCount >= retryLimit) {
        throw error;
      }

      this.logger.error(error);

      await this.truncate(retryLimit, retryCount + 1);
    }
  }
}
