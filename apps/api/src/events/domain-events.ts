export class WhatsappMessageReceived {
  constructor(public readonly message: any, public readonly conversation: any) {}
}

export class LeadCreated {
  constructor(public readonly leadId: string) {}
}

export class PaymentOverdue {
  constructor(public readonly creditId: string, public readonly amount: number) {}
}

export class LegalDeadlineApproaching {
  constructor(public readonly eventId: string) {}
}

export class AiAnalysisCompleted {
  constructor(public readonly analysisId: string) {}
}

export class CreditStatusChanged {
  constructor(public readonly creditId: string, public readonly status: string) {}
}

export class PayrollApproved {
  constructor(public readonly payrollId: string) {}
}
