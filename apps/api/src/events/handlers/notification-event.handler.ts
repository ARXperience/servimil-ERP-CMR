import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentOverdue, LegalDeadlineApproaching } from '../domain-events';
import { NotificationsService } from '../../modules/notifications/notifications.service';

@Injectable()
export class NotificationEventHandler {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent('payment.overdue')
  async handlePaymentOverdue(event: PaymentOverdue) {
    // Notify admins or assigned agent
    // For demo, assuming user ID 'admin'
    await this.notificationsService.createNotification(
      'admin',
      'Payment Overdue',
      `Credit ${event.creditId} has an overdue amount of ${event.amount}`,
      'ALERT'
    );
  }

  @OnEvent('legal.deadline_approaching')
  async handleLegalDeadline(event: LegalDeadlineApproaching) {
    await this.notificationsService.createNotification(
      'admin',
      'Legal Deadline Approaching',
      `Event ${event.eventId} is approaching.`,
      'LEGAL'
    );
  }
}
