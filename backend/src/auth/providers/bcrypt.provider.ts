import { HashingAbstract } from './hashing.providet';
import * as bcrypt from 'bcrypt';

export class HashingProvider implements HashingAbstract {
  async hashPassword(password): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
  comparePassword(password: string, password_hash: string): Promise<boolean> {
    return bcrypt.compare(password, password_hash);
  }
}
