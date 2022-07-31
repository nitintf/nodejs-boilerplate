import { UserAttributes } from 'app/models/user';
import { ServiceContext } from 'app/types';
import { Transaction } from 'sequelize';

export const createUserQuery = async (
  input: UserAttributes,
  context: ServiceContext,
  transaction: Transaction,
) => {
  return await context.models.User.create(input, {
    transaction,
  });
};
