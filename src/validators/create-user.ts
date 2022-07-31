import { createValidator } from 'app/lib/validator';

interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export const validateCreateUser = createValidator<CreateUserPayload>({
  type: 'object',
  required: ['email', 'password', 'firstName', 'lastName'],
  properties: {
    email: { type: 'email' },
    password: { type: 'string', minLength: 6 },
    firstName: { type: 'string', minLength: 3 },
    lastName: { type: 'string', minLength: 3 },
  },
});
