import { Injectable } from '@nestjs/common';
//src/auth/providers/hashing.provider.ts
@Injectable()
export abstract class HashingAbstract {
  abstract hashPassword(password: string | Buffer): Promise<string>;
  abstract comparePassword(
    password: string,
    password_hash: string,
  ): Promise<boolean>;
}
