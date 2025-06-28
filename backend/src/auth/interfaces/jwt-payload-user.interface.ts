// src/auth/interfaces/jwt-payload-user.interface.ts

export interface JwtPayloadUser {
  sub: number;
  userId: string;
  email: string;
  roles: string[];
}
