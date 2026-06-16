import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeadCreated } from '../domain-events';

@Injectable()
export class LeadEventHandler {
  @OnEvent('lead.created')
  handleLeadCreated(event: LeadCreated) {
    console.log(`Lead created: ${event.leadId}. Triggering automations...`);
    // Here we could trigger a welcome email or WhatsApp message
  }
}
