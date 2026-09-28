CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  channel text NOT NULL DEFAULT 'whatsapp' CHECK (channel='whatsapp'),
  phone text NOT NULL,
  display_name text,
  lead_id uuid REFERENCES leads(id),
  assigned_to uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','archived')),
  consent_status text NOT NULL DEFAULT 'unknown' CHECK (consent_status IN ('unknown','opted_in','opted_out')),
  consent_source text,
  consent_recorded_at timestamptz,
  last_inbound_at timestamptz,
  unread_count integer NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, channel, phone)
);
CREATE INDEX conversations_org_recent_idx ON conversations (organization_id, updated_at DESC) WHERE status='open';

CREATE TABLE conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  conversation_id uuid NOT NULL REFERENCES conversations(id),
  provider_message_id text,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  status text NOT NULL CHECK (status IN ('received','queued','sent','delivered','read','failed')),
  message_type text NOT NULL DEFAULT 'text',
  content text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  UNIQUE (organization_id, provider_message_id)
);
CREATE INDEX conversation_messages_org_conversation_idx ON conversation_messages (organization_id, conversation_id, created_at DESC);

CREATE TABLE webhook_receipts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  provider text NOT NULL CHECK (provider='whatsapp_cloud'),
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  body_hash text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (organization_id, provider, provider_event_id)
);
CREATE INDEX webhook_receipts_org_received_idx ON webhook_receipts (organization_id, received_at DESC);

CREATE TABLE message_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  conversation_id uuid NOT NULL REFERENCES conversations(id),
  message_id uuid NOT NULL UNIQUE REFERENCES conversation_messages(id),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX message_outbox_claim_idx ON message_outbox (available_at, created_at) WHERE state IN ('pending','processing');
