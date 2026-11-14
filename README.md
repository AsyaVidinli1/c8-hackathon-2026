# Veliaht OS — connected hackathon demo

Single-company management workspace for the **Asya & Ecrin** free-track project.
The imported interface now uses a Python HTTP backend, persistent SQLite records,
server-controlled demo sessions and a real, source-referenced AI assistant.

## Start on this Mac

Requires Python 3.10+; no pip or npm installation is needed.

```bash
python3 server.py
```

Open **http://127.0.0.1:3000**. Keep the Terminal open.
Choose an owner, manager or employee demo account. This is **explicit demo account
selection, not production authentication**. Only sample company data should be used.

The application must be served by `server.py`. GitHub Pages can serve the old static
interface but cannot run this backend, SQLite or AI endpoint.

Create a local `.env` (never commit it):

```dotenv
AI_GATEWAY_API_KEY=your_team_key
AI_MODEL=anthropic/claude-haiku-5.5
PORT=3000
```

The AI key is used only by the backend at the Vercel AI Gateway Chat Completions
endpoint. The event key expires at 19:00 Rome time on the event day, according to
the event instructions. It is not a coding-agent credential.

## Three-minute demo flow

1. Choose the owner demo account.
2. Open **AI Advisor → Company Assistant · AI**. Switch language with EN/TR.
3. Ask: **Can Ahmet offer a 12% discount? Whose approval is needed?**
4. Inspect the answer's policy/role-card source cards and open the original record.
5. Edit Ahmet's decision rights in Governance. Wait for **SQLite · Saved**.
6. Refresh; verify the new role card is still present. Ask the question again.
   If the edited role card now contradicts the policy, the assistant should flag
   the conflict instead of inventing precedence.
7. Stop and restart the server; records and AI history remain in SQLite.
8. Sign out and select an employee: company-wide AI and other people's tasks are
   unavailable. Managers only receive their scoped records for AI.

The old preconfigured assistant questions remain labeled **Quick Checks · Rules**.
Risk alerts, health briefs, role-profile drafting and meeting summaries still use
the existing deterministic logic; they are not claimed to use the live model.

## Storage and access

- `data/seed.json`: sample data used once when creating a new database.
- `data/veliaht.db`: local runtime database, ignored by Git.
- Each record is stored separately, with transactional change batches, an audit
  history, and conflict checks. Reads are scoped on the server before the browser
  or model receives them.
- Family policies are owner-only. Employee tasks and scorecards are self-scoped.
- Browser storage is no longer the source of truth. Legacy data is retained as a
  local backup, not automatically imported into the company database.
- Sessions use opaque, server-side tokens and HttpOnly, SameSite cookies.
- Only files inside `public/` are served; `.env`, the database and seed stay private.

## AI behavior and limits

The server selects a small set of permitted company records with keyword ranking,
including role cards and active policies. It calls the actual configured model,
validates returned source IDs against that exact set, stores an answer-time source
snapshot, and exposes links to inspect the records. Unknown source IDs cause an
error; an answer without sources is replaced by an explicit missing-evidence message.

Source-ID validation is not proof that every model claim is correct. Human review
is required. Retrieval is deliberately bounded and is not a complete search of a
large company archive. The assistant cannot approve transactions or change records.

## Checks

```bash
python3 -m unittest discover -s tests -v
node tests/test_frontend.js
```

Backend tests cover persistence/reopen, sessions, authorization, scope isolation,
transaction rollback, stale-write conflicts and AI source validation with a fake
provider. A real-model test must be run separately with the event key and network
access. Automated checks do not imply that a public deployment has been verified.

## Hosting

No public deployment has been configured. For hosting, run the Python process on
a host with **persistent disk**, set DATABASE_PATH to that disk, and set the key
as a server-side environment variable. Serverless ephemeral disk is unsuitable for
this SQLite design. Keep the default localhost binding for the local demo.

This single-company demo is not a production SaaS. Production needs real identity
and account recovery, tenant isolation, stronger input/schema validation, rate
limits, backups, deployment hardening and a security review. Do not put private
client data into the public demo or enable unauthenticated demo identities for it.
