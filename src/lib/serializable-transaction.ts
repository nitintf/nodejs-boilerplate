import { UserContext, ServiceContext, AUTH_USER_TYPE, isUserContext } from 'app/types';
import { Transaction } from 'sequelize';
const TRANSACTION_RETRY_LIMIT = 4;

export async function createSerializableTransaction<T>(
  context: UserContext | ServiceContext,
  cb: (transaction: Transaction) => Promise<T>,
  retry = true,
  maxRetry = TRANSACTION_RETRY_LIMIT,
  retryCount = 0,
) {
  if (isUserContext(context)) {
    return context.models.serializableTransaction(
      context.userId,
      context.userEmail,
      context.userType,
      cb,
      retryCount,
      retry,
      maxRetry,
    );
  }

  return context.models.serializableTransaction(
    undefined,
    undefined,
    AUTH_USER_TYPE.USER,
    cb,
    retryCount,
    retry,
    maxRetry,
  );
}
