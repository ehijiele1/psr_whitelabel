-- PrinceSteve Residence Migration 21: Add idempotency index on payments
-- Prevents duplicate charge.success events from inserting duplicate payment rows
-- when Paystack sends the same webhook event more than once (race condition)

CREATE UNIQUE INDEX IF NOT EXISTS uniq_payments_paystack_ref
  ON payments(paystack_ref) WHERE paystack_ref IS NOT NULL;
