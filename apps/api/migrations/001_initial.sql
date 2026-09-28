CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  auth_subject text NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'agent')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO organizations (id, name) VALUES ('00000000-0000-4000-8000-000000000001', 'Executive Lead Control') ON CONFLICT (id) DO NOTHING;
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  budget_amount numeric(14,2) CHECK (budget_amount IS NULL OR budget_amount >= 0),
  budget_currency char(3) CHECK (budget_currency IS NULL OR budget_currency IN ('AED', 'USD', 'EUR', 'GBP')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'qualifying', 'qualified', 'assigned', 'contacted', 'meeting_scheduled', 'nurture', 'won', 'lost')),
  source text NOT NULL DEFAULT 'Manual',
  notes text,
  assigned_to uuid REFERENCES users(id),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CHECK ((budget_amount IS NULL) = (budget_currency IS NULL))
);
CREATE INDEX leads_org_created_idx ON leads (organization_id, created_at DESC) WHERE archived_at IS NULL;
CREATE INDEX leads_org_status_idx ON leads (organization_id, status) WHERE archived_at IS NULL;
CREATE INDEX leads_phone_idx ON leads (organization_id, phone);

CREATE TABLE lead_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  lead_id uuid NOT NULL REFERENCES leads(id),
  agent_id uuid NOT NULL REFERENCES users(id),
  assigned_by text NOT NULL,
  reason text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz
);
CREATE INDEX lead_assignments_org_agent_idx ON lead_assignments (organization_id, agent_id) WHERE unassigned_at IS NULL;
CREATE UNIQUE INDEX one_active_assignment_per_lead_idx ON lead_assignments (organization_id, lead_id) WHERE unassigned_at IS NULL;

CREATE TABLE lead_stage_transitions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  lead_id uuid NOT NULL REFERENCES leads(id),
  from_status text,
  to_status text NOT NULL,
  reason text,
  actor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_transitions_org_lead_idx ON lead_stage_transitions (organization_id, lead_id, created_at);

CREATE TABLE audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  actor_id text NOT NULL,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_org_created_idx ON audit_events (organization_id, created_at DESC);

