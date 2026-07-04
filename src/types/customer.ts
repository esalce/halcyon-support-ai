import { z } from 'zod';

export const RegionSchema = z.enum(['US', 'UK']);
export type Region = z.infer<typeof RegionSchema>;

export const TierSchema = z.enum(['standard', 'plus']);
export type Tier = z.infer<typeof TierSchema>;

export const AccountStatusSchema = z.enum(['active', 'suspended', 'closed']);
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

export const ProductTypeSchema = z.enum([
  'card_purchase',
  'wire_transfer',
  'crypto',
  'international_transfer',
]);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const TransactionSchema = z.object({
  txn_id: z.string(),
  merchant: z.string(),
  amount: z.number(),
  date: z.string().date(),
  product_type: ProductTypeSchema,
  disputed: z.boolean(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

/**
 * SPEC §3.2. The policy engine may read every field; LLM prompts receive only
 * the allowlist {first_name, tier, region, account_status} plus scoped
 * injections approved by the policy engine (SPEC §7).
 */
export const CustomerRecordSchema = z.object({
  customer_id: z.string(),
  first_name: z.string(),
  tier: TierSchema,
  account_status: AccountStatusSchema,
  region: RegionSchema,
  signup_date: z.string().date(),
  open_ticket_id: z.string().nullable(),
  recent_disputes: z.number().int().nonnegative(),
  // deterministic-only fields — never interpolated into prompts:
  transactions: z.array(TransactionSchema),
  next_deposit_date: z.string().date().nullable(),
});
export type CustomerRecord = z.infer<typeof CustomerRecordSchema>;
