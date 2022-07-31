import { UserAttributes } from 'app/models/user';
import { serializeNullable } from './common';

export const serializeUser = (obj: UserAttributes) => ({
  id: serializeNullable(obj.id),
  firstName: serializeNullable(obj.firstName),
  lastName: serializeNullable(obj.lastName),
  email: serializeNullable(obj.email),
});
