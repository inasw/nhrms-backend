import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User; // This adds the optional user property to all Request objects
    }
  }
}