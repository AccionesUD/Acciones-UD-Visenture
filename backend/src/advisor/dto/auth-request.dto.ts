// src/auth/interfaces/authenticated-request.interface.ts
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    accountId: string;
    email: string;
    userId: string;
    roles: string[];
  };
}