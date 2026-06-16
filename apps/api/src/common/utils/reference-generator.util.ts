import { randomBytes } from 'crypto';

export class ReferenceGeneratorUtil {
  /**
   * Generates a unique reference based on a prefix, current date, and random alphanumeric string.
   * Format: PREFIX-YYYYMMDD-XXXX
   * @param prefix String prefix for the reference (e.g. 'TXN', 'CRD')
   */
  static generate(prefix: string): string {
    const date = new Date();
    const dateString = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomStr = randomBytes(2).toString('hex').toUpperCase();
    
    return `${prefix.toUpperCase()}-${dateString}-${randomStr}`;
  }

  /**
   * Generates a short random string, useful for IDs or short codes
   * @param length Length of the string
   */
  static generateShortCode(length: number = 6): string {
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
      .toUpperCase();
  }
}
