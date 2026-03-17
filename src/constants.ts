export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  USAGE_ERROR: 2,
  COMMAND_NOT_FOUND: 127,
  INTERRUPTED: 130,
} as const;

export const SERVER_PATHS = {
  DEPLOYMENTS: ['standalone', 'deployments'],
  DATA: ['standalone', 'data'],
  LOG: ['standalone', 'log'],
  TMP: ['standalone', 'tmp'],
} as const;
