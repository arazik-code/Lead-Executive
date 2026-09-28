ALTER TABLE leads ADD COLUMN score integer CHECK (score IS NULL OR score BETWEEN 0 AND 100);
ALTER TABLE leads ADD COLUMN score_updated_at timestamptz;

CREATE TABLE qualification_form_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  version integer NOT NULL CHECK (version > 0),
  state text NOT NULL CHECK (state IN ('draft', 'published', 'retired')),
  form jsonb NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE (organization_id, version)
);
CREATE UNIQUE INDEX one_published_form_per_org_idx ON qualification_form_versions (organization_id) WHERE state = 'published';

CREATE TABLE lead_answers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  lead_id uuid NOT NULL REFERENCES leads(id),
  form_version_id uuid NOT NULL REFERENCES qualification_form_versions(id),
  attempt integer NOT NULL DEFAULT 1 CHECK (attempt > 0),
  answers jsonb NOT NULL,
  submitted_by text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, lead_id, form_version_id, attempt)
);

CREATE TABLE qualification_score_snapshots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  lead_id uuid NOT NULL REFERENCES leads(id),
  form_version_id uuid NOT NULL REFERENCES qualification_form_versions(id),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  completion_rate integer NOT NULL CHECK (completion_rate BETWEEN 0 AND 100),
  scoring_version integer NOT NULL,
  breakdown jsonb NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE routing_rule_set_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  version integer NOT NULL CHECK (version > 0),
  state text NOT NULL CHECK (state IN ('draft', 'active', 'retired')),
  rules jsonb NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  UNIQUE (organization_id, version)
);
CREATE UNIQUE INDEX one_active_routing_rules_per_org_idx ON routing_rule_set_versions (organization_id) WHERE state = 'active';

CREATE TABLE agent_profiles (
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  specialties text[] NOT NULL DEFAULT '{}',
  regions text[] NOT NULL DEFAULT '{}',
  max_active_leads integer NOT NULL DEFAULT 15 CHECK (max_active_leads > 0),
  median_response_minutes numeric(8,2) NOT NULL DEFAULT 999 CHECK (median_response_minutes >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);
CREATE TABLE routing_decisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  lead_id uuid NOT NULL REFERENCES leads(id),
  rule_set_version_id uuid REFERENCES routing_rule_set_versions(id),
  outcome text NOT NULL CHECK (outcome IN ('assigned', 'queued', 'manual')),
  matched_rule_id text,
  eligible_agent_ids uuid[] NOT NULL DEFAULT '{}',
  selected_agent_id uuid REFERENCES users(id),
  explanation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX routing_decisions_org_created_idx ON routing_decisions (organization_id, created_at DESC);
