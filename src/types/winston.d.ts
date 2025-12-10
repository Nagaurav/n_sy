import * as winston from 'winston';

declare module 'winston' {
  // Extend the Logger interface to include the stream property
  interface Logger {
    stream: {
      write: (message: string) => void;
    };
  }
}

export {};
