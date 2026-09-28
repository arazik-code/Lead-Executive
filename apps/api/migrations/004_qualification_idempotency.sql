ALTER TABLE lead_answers ADD COLUMN idempotency_key text;
ALTER TABLE lead_answers ADD COLUMN response_json jsonb;
CREATE UNIQUE INDEX lead_answers_idempotency_idx ON lead_answers (organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
