import { PrismaClient } from '@prisma/client';

// Extend the PrismaClient to include our custom types
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// This ensures we're using a single PrismaClient instance across the app
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

// Define the transaction type
export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>;
