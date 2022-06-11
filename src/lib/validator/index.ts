import Ajv, { ValidateFunction as AjvValidateFunction } from 'ajv';
import { ValidationError } from 'app/lib/errors';

const ajv = new Ajv({
  useDefaults: true,
  allErrors: true,
  removeAdditional: 'all',
});

interface ValidateFunction<T> extends AjvValidateFunction {
  _t?: T; // avoid unused parameter lint warnings
}

function makeValidator<T>(schema: object): ValidateFunction<T> {
  return ajv.compile(schema);
}

function isValid<T>(validator: ValidateFunction<T>, input: unknown): input is T {
  return validator(input) === true;
}

export function createValidator<T>(schema: object) {
  const validator = makeValidator<T>(schema);

  return (input: unknown) => {
    if (!isValid<T>(validator, input)) {
      throw new ValidationError(ajv.errorsText(validator.errors));
    }

    return input;
  };
}
