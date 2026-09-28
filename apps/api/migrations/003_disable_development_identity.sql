-- Development identities must be provisioned explicitly by the local-only seeder.
UPDATE users SET active = false WHERE auth_subject = 'local-admin';
