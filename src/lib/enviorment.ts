function getDefault<T>(variableName: string, defaultValue?: T): T {
  if (defaultValue == null) {
    throw new Error(`Missing value for environment variable ${variableName}.`);
  }

  return defaultValue;
}

export function getString(
  processEnv: NodeJS.ProcessEnv,
  variableName: string,
  defaultValue?: string,
): string {
  const value = processEnv[variableName];

  if (value == null) {
    return getDefault(variableName, defaultValue);
  }

  return value;
}

export function getNumber(
  processEnv: NodeJS.ProcessEnv,
  variableName: string,
  defaultValue?: number,
): number {
  const value = processEnv[variableName];

  if (value == null) {
    return getDefault(variableName, defaultValue);
  }

  const result = Number(value);

  if (!Number.isFinite(result)) {
    throw new Error(`Could not parse environment variable ${variableName} as a number`);
  }

  return result;
}

export function getBoolean(
  processEnv: NodeJS.ProcessEnv,
  variableName: string,
  defaultValue?: boolean,
): boolean {
  const value = processEnv[variableName];

  if (value == null) {
    return getDefault(variableName, defaultValue);
  }

  if (value === 'true') {
    return true;
  } else if (value === 'false') {
    return false;
  }

  throw new Error(`Could new parse environment variable ${variableName} as a boolean.`);
}

// export function getStarfleetBaseUrl() {
//   const env = getString(process.env, 'ENVIRONMENT', ENVIRONMENT.PROD);
//   switch (env) {
//     case ENVIRONMENT.DEV:
//       return 'https://starfleet-dev.robot.car';
//     case ENVIRONMENT.STAGING:
//       return 'https://starfleet-staging.robot.car';
//     case ENVIRONMENT.LOCAL:
//       return 'https://localhost:8001';
//     case ENVIRONMENT.PROD:
//     default:
//       return 'https://starfleet.robot.car';
//   }
// }
