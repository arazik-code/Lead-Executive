import { BadRequestException } from '@nestjs/common';

export const leadStatuses = ['new', 'qualifying', 'qualified', 'assigned', 'contacted', 'meeting_scheduled', 'nurture', 'won', 'lost'] as const;
export type LeadStatus = typeof leadStatuses[number];

const allowedTransitions: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ['qualifying', 'nurture'], qualifying: ['qualified', 'nurture'], qualified: ['assigned', 'nurture'],
  assigned: ['contacted', 'qualifying', 'nurture'], contacted: ['meeting_scheduled', 'won', 'lost', 'nurture'],
  meeting_scheduled: ['won', 'lost', 'nurture'], nurture: ['qualifying', 'assigned', 'lost'], won: [], lost: ['nurture'],
};

export function assertLeadTransition(from: string, to: string): asserts to is LeadStatus {
  if (!leadStatuses.includes(from as LeadStatus) || !allowedTransitions[from as LeadStatus].includes(to as LeadStatus)) {
    throw new BadRequestException(`Lead cannot move from ${from} to ${to}`);
  }
}
