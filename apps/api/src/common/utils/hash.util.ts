import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export class HashUtil {
  static async hash(data: string): Promise<string> {
    return bcrypt.hash(data, SALT_ROUNDS);
  }

  static async compare(data: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}
