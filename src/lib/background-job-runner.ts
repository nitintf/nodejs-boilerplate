import { ServiceContext } from 'app/types';
import { Transaction } from 'sequelize';

type Handler = (
  context: ServiceContext,
  transaction: Transaction,
  payload: any | unknown,
  userEmail: string,
) => Promise<any>;

/**
 * This class runs background Jobs that have been entered into the database
 */
export default class BackgroundJobRunner {
  private handlerMap: Map<string, Handler>;
  private SLEEP_TIME_IN_MILLS: number;

  constructor(sleepTimeInMills = 200) {
    this.handlerMap = new Map();
    this.SLEEP_TIME_IN_MILLS = sleepTimeInMills;
  }
}
