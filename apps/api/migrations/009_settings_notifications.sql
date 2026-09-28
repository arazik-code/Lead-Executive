ALTER TABLE users ADD CONSTRAINT users_org_user_unique UNIQUE (organization_id,id);

CREATE TABLE organization_app_settings (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id),
  default_currency char(3) NOT NULL DEFAULT 'AED' CHECK (default_currency IN ('AED','USD','EUR','GBP')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO organization_app_settings (organization_id,updated_by)
SELECT id,'system:migration' FROM organizations ON CONFLICT (organization_id) DO NOTHING;

CREATE TABLE user_notification_preferences (
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  preferences jsonb NOT NULL DEFAULT '{"newLead":true,"assignment":true,"whatsappMessage":true,"stageUpdate":true}'::jsonb CHECK (jsonb_typeof(preferences)='object'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id,user_id),
  FOREIGN KEY (organization_id,user_id) REFERENCES users(organization_id,id) ON DELETE CASCADE
);

CREATE TABLE user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  event_key text NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  UNIQUE (organization_id,user_id,event_key),
  FOREIGN KEY (organization_id,user_id) REFERENCES users(organization_id,id) ON DELETE CASCADE
);
CREATE INDEX user_notifications_inbox_idx ON user_notifications (organization_id,user_id,created_at DESC);
CREATE INDEX user_notifications_unread_idx ON user_notifications (organization_id,user_id,created_at DESC) WHERE read_at IS NULL;
