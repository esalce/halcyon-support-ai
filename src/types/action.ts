import { z } from 'zod';

/** SPEC §3.1 — every turn resolves to exactly one of these. */
export const ActionSchema = z.enum([
  'ANSWER',
  'ESCALATE_CREATE_TICKET',
  'ESCALATE_UPDATE_TICKET',
  'ESCALATE_WITH_APPROVED_RESPONSE',
  'ROUTE_INCIDENT_MACRO',
]);

export type Action = z.infer<typeof ActionSchema>;
