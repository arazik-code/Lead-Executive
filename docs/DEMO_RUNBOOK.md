# Executive Lead Control demo runbook

The demo uses a local PostgreSQL database, the development-only API identity, and fully synthetic CRM records. It does not need Google Workspace credentials, a public host, or a WhatsApp provider account. Keep Meta/WhatsApp credentials unset: outbound provider integration is intentionally disabled for the seeded demonstration.

## Start the demo

Requirements: Docker Compose with PostgreSQL 17.

From the project root, start the complete local demo stack:

```sh
docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile demo up --build
```

On first startup, the API container runs migrations, provisions the local development identity, seeds the synthetic records, and then starts the API. The web client is served at `http://localhost:8080`; choose **Sign in to local API**. The seeded identity is `local-admin`; it is a local development header identity, not a password. The seed is idempotent for its fixed example records. Run it only against the local Compose database; never point the development seed at live prospect data.

## Suggested 6–8 minute recording

1. **Workspace overview** — show the live dashboard counts, pipeline distribution, recent intake and audit trail. Explain that counts come from the API and respect the signed-in role.
2. **Lead register and CSV** — search for “Leila”, open the lead history, inspect its budget/source/stage, and point out the next-action controls. Import [`docs/demo-sample-leads.csv`](demo-sample-leads.csv), review the row validation/duplicate preview, then commit the two synthetic rows. Show that the starter sample spans every lifecycle stage.
3. **Qualification** — open the active versioned form for Omar, submit the visible sample answers, and show the score and per-answer explanation. Explain that this is a sample policy and needs business approval/calibration.
4. **Routing** — inspect agent capacity and policy, preview a qualified lead, then explicitly route an unassigned qualified lead. Show the decision explanation and assignment record. Routing is a deliberate operator action, not an autonomous background action.
5. **Pipeline** — advance a lead to a permitted next stage and show the updated record. Explain that invalid jumps are rejected and events are audited.
6. **WhatsApp inbox** — open Leila’s synthetic thread, inspect unread state/assignee and show assignment controls. The composer is disabled, and the API independently rejects sends from seed-tagged sample contacts, even if provider credentials are added later. The transcript uses synthetic data with no consent claim; the local demo makes no provider calls.
7. **Analytics and notifications** — set a date range, inspect cohort rates/source mix, export a demo report if useful, then open the seeded lead/message notifications and follow their links.
8. **Team and settings** — show the sample manager/agents, Workspace sign-in readiness, role model, and the unset provider readiness. Clarify that actual Google OAuth and deployment configuration remain external setup steps.

## Reset and safety

The seed upserts its fixed synthetic records and refreshes its example message history. To reset the local demo database, stop the demo and remove the Compose volume using `docker compose -f docker-compose.yml -f docker-compose.demo.yml --profile demo down -v`; this permanently removes that local volume. The seed itself rejects production mode, non-development authentication, absent explicit `DEMO_SEED=1`, and a configured WhatsApp access token or phone number ID. Do not import the adjacent customer/prospect CSV files into the demo.

## Recording deliverable

Capture the walkthrough using the desktop screen recorder at 1920×1080, 30 fps, with the browser zoom set to 100%. Keep the browser viewport and cursor steady, use synthetic data only, pause briefly on each page, and stop recording before showing local configuration or developer tools. Save the finished recording as `artifacts/executive-lead-control-demo.mp4` and review playback before sharing it.

## Known demo boundaries

- The demo database is local and uses a development identity.
- Google Workspace OAuth client ID/domain and allowed origin are unconfigured.
- WhatsApp Cloud API credentials and approved templates are unconfigured.
- The qualification and routing examples are deterministic demonstrations, not business-approved or outcome-calibrated policy.
- No customer CSV is included in or loaded by the demo seed.
