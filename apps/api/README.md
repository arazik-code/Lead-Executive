# Executive Lead Control API

NestJS 12 modular API and PostgreSQL persistence for the internal CRM. Node.js 24.15+ is the supported runtime baseline.

## Local setup

1. Copy `.env.example` to `.env` and keep `AUTH_MODE=development` only on a local machine.
2. From the application directory, start PostgreSQL with `docker compose up -d postgres`.
3. Install packages with `pnpm --dir apps/api install`.
4. Apply schema with `pnpm --dir apps/api db:migrate`.
5. Explicitly seed the local-only identity with `pnpm --dir apps/api db:seed:development`.
6. Run the API with `pnpm --dir apps/api start:dev`.

The API listens on `http://localhost:4000`; OpenAPI docs are at `/api/docs`; liveness and database readiness are `/api/v1/health/live` and `/api/v1/health/ready`. Local development binds to loopback so the development identity header is not exposed to the LAN.

For local API calls, send `x-dev-user-id: local-admin`. This header is accepted only when `AUTH_MODE=development` and `NODE_ENV` is not `production`; migrations disable the local identity, and the explicit seeder enables it only on a local development setup. Production browser sign-in uses Google Identity Services. Set `AUTH_MODE=oidc`, `OIDC_AUDIENCE` to the web OAuth client ID, `OIDC_EMAIL_DOMAIN` to the exact Workspace domain, issuer `https://accounts.google.com`, and JWKS URL `https://www.googleapis.com/oauth2/v3/certs`; set the same client ID as `VITE_GOOGLE_CLIENT_ID` in the web build. An admin provisions a member by verified Workspace email in Team. On first verified sign-in, the API binds the Google subject to that unbound member row. Role and active status remain server-authoritative. Production startup rejects missing identity/domain config, non-HTTPS or wildcard CORS origins, local auth, and partial WhatsApp credentials.

## Current API surface

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/auth/me`
- `GET /api/v1/leads?limit=25&offset=0`
- `POST /api/v1/leads`
- `GET /api/v1/leads?q=search&status=qualified` for organization-scoped search and filtering
- `PATCH /api/v1/leads/:id` for audited lead edits
- `PATCH /api/v1/leads/:id/status` for validated, audited lifecycle transitions
- `POST /api/v1/leads/:id/assign-self` for capacity-checked agent assignment
- `GET /api/v1/leads/assignees` and `POST /api/v1/leads/:id/assign` for manager/admin capacity-aware manual assignment and reassignment with an audit reason
- `POST /api/v1/leads/:id/archive` for audited soft archive and assignment release
- `GET /api/v1/leads/:id/activity` for the scoped stage, assignment, and audit timeline
- `GET /api/v1/settings`, `PATCH /api/v1/settings/organization`, and `GET/PATCH /api/v1/settings/preferences` for organization defaults and versioned per-user notification preferences
- `GET/POST /api/v1/organization/members` and `PATCH /api/v1/organization/members/:id` for admin provisioning and membership access/role management
- `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, and `POST /api/v1/notifications/read-all` for the user-scoped notification inbox
- `GET /api/v1/search?q=...` for role-scoped lead and WhatsApp conversation search
- `GET /api/v1/conversations/assignees`, `PATCH /api/v1/conversations/:id/assignment`, and `POST /api/v1/conversations/:id/unassign` for audited WhatsApp inbox ownership changes
- `GET /api/v1/qualification/forms/active` for the currently published, immutable qualification form
- `POST /api/v1/qualification/forms` and `POST /api/v1/qualification/forms/:id/publish` for versioned manager/admin configuration
- `POST /api/v1/leads/:id/qualification-answers` to validate typed answers, persist an explainable score snapshot, and update the lead score; optional `Idempotency-Key` makes retries safe
- `GET /api/v1/routing/rules/active`, `POST /api/v1/routing/rules`, and `POST /api/v1/routing/rules/:id/activate` for versioned routing policy
- `PATCH /api/v1/routing/agents/:userId` for capacity, availability, specialties, regions, and response profile configuration
- `GET /api/v1/leads/:id/routing-preview` for a non-mutating decision preview; `POST /api/v1/leads/:id/route` for a locked, capacity-aware, audited assignment or queue decision

Lead creation validates input, normalizes UAE phone numbers to E.164, scopes records to the configured organization, and writes the lead, audit event, lifecycle entry, and manager notifications in one transaction. The authenticated Leads, Pipeline, Qualification, Routing, Messages, Dashboard, Analytics, Settings, Team, Help, notification inbox, and global search use the API; unauthenticated prototype mode remains separate. Migration 012 enables PostgreSQL `pg_trgm` and indexes the CRM search fields.

## Local demo records

After migrations and `db:seed:development`, keep WhatsApp credentials unset and seed the synthetic demo:

```powershell
$env:DEMO_SEED = '1'
pnpm --dir apps/api db:seed:demo
Remove-Item Env:DEMO_SEED
```

The command refuses to run outside development auth or when WhatsApp phone ID/access token is present. It creates synthetic lead, qualification, routing, team, conversation, audit, and notification data; it never calls Google or Meta. Seeded conversations have no consent record, and the API blocks outbound sending from demo-tagged contacts even if a provider is configured later. The product walkthrough is in [`docs/DEMO_RUNBOOK.md`](../../docs/DEMO_RUNBOOK.md).

## Security and deployment

`docker-compose.yml` is for local development only; Postgres binds to loopback. Use managed Postgres, TLS, managed secrets, backups, network restrictions, and separate credentials for production. Never deploy with development auth or the sample database password. Run migrations in order; the runner stores normalized-SQL SHA-256 checksums and rejects edited applied migrations. Migration 010 fails if case-insensitive duplicate member emails need resolution. Production startup validates required configuration but does not replace database migration/readiness checks. Review access policies and retention before importing contact data.
