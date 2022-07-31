import { createSerializableTransaction } from 'app/lib/serializable-transaction';
import { createUserQuery } from 'app/querys';
import { serializeUser } from 'app/serializers';
import { ServiceContext } from 'app/types';
import { validateCreateUser } from 'app/validators';

export const createUser = async (input: unknown, context: ServiceContext) => {
  const validInput = validateCreateUser(input);

  const result = await createSerializableTransaction(context, async (transaction) => {
    return createUserQuery(validInput, context, transaction);
  });

  return serializeUser(result);
};
