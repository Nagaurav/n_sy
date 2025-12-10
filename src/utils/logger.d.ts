import * as winston from 'winston';

declare const logger: winston.Logger & {
  stream: {
    write: (message: string) => void;
  };
};

export { logger };
