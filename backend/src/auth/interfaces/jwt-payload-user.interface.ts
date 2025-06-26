// src/auth/interfaces/jwt-payload-user.interface.ts

export interface JwtPayloadUser {
  accountId: number;
  userId: string;
  email: string;
  roles: string[];
}