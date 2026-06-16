export class DateUtil {
  static getColombianDate(): Date {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const diff = utcDate.getTime() - tzDate.getTime();
    
    return new Date(date.getTime() - diff);
  }
}
