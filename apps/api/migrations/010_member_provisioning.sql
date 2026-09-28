-- Provision members before their first OIDC login, then bind the verified identity once.
ALTER TABLE users ALTER COLUMN auth_subject DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM users
    GROUP BY organization_id, lower(email)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Migration 010 found duplicate member emails within an organization; resolve duplicates before provisioning users';
  END IF;
END $$;

CREATE UNIQUE INDEX users_org_email_ci_unique_idx ON users (organization_id, lower(email));

CREATE INDEX users_org_active_role_idx ON users (organization_id, role, active);
