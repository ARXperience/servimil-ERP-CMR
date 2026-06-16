import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    return new Promise<string>((resolve) => {
      const tracker = req.headers['x-forwarded-for'] || req.ips?.length ? req.ips[0] : req.ip;
      resolve(tracker as string);
    });
  }
}
