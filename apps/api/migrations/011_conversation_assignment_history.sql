CREATE TABLE conversation_assignment_history (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  conversation_id uuid NOT NULL REFERENCES conversations(id),
  previous_assignee uuid,
  assigned_to uuid,
  assigned_by text NOT NULL,
  reason text NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id,previous_assignee) REFERENCES users(organization_id,id),
  FOREIGN KEY (organization_id,assigned_to) REFERENCES users(organization_id,id)
);

CREATE INDEX conversation_assignment_history_recent_idx ON conversation_assignment_history (organization_id,conversation_id,assigned_at DESC);
