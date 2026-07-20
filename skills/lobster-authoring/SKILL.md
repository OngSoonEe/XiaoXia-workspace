---
name: lobster-authoring
description: >
  Use when creating, modifying, or fixing Lobster automation workflows (taskflow YAML files
  in lobster-automation projects). Triggers on: "create a lobster workflow", "add a cron
  schedule", "build an automation", "fix the taskflow", "lobster automation", "workflow
  YAML", "step runner", "add a webhook", "external webhook", "Telegram webhook", or when
  asked to author/edit any .yaml file under projects-list/*/taskflows/. This skill is the
  single source of truth for lobster authoring — any AI working on lobster workflows
  must read this skill before writing ANY YAML.
---

# Lobster Authoring — Single Source of Truth

This skill defines every rule for writing valid lobster taskflow YAML. Read it in full
before writing or modifying any `.yaml` file in a lobster project. When in doubt, read
the reference files — they are authoritative.

## ⚠️ Non-Negotiable Rules

These rules exist because every one of them has broken a workflow in production.
**Never deviate from these rules.** If the task seems to require something not covered
here, ask before proceeding.

---

### Rule 1 — Cron Registration Is Automatic

**You do NOT need to run any CLI command to register a cron.**

The lobster server auto-discovers flows by scanning for `.yaml` files in
`/home/ubuntu/works/lobster-automation/projects-list/*/taskflows/`. To register a new cron:

1. Write the YAML to the correct path (see Rule 6)
2. Trigger a flow reload via `POST /flows/reload`
3. Verify with `GET /schedules/:name` (see the Verification section below)

There is NO `lobster register-cron` command. There is NO manual step in a web UI.
**Placement + reload = registration.**

---

### Rule 2 — Cron Is 5 Fields Only

The cron parser supports **standard 5-field cron**: `minute hour day-of-month month day-of-week`

```yaml
# ✅ Correct — 5 fields
schedule:
  cron: "30 23 * * *"
  timezone: Asia/Kuala_Lumpur

# ❌ WRONG — 6 fields (includes seconds) — will silently fail or produce wrong times
schedule:
  cron: "0 30 23 * * *"

# ❌ WRONG — 4 fields (missing day-of-week)
schedule:
  cron: "30 23 * *"
```

**Supported cron features:**
- Lists: `0 9,21 * * *` (run at 9 AM and 9 PM)
- Steps: `*/15 * * * *` (every 15 minutes)
- Ranges: `0 9-17 * * *` (every hour from 9 AM to 5 PM)
- Wildcard: `* * * * *` (every minute)

---

### Rule 3 — `retry` Is Inline on Script Steps, Not a Separate Step

**Retry is a property of a script step — it does NOT create its own step.**

```yaml
# ✅ CORRECT — retry is a property of the script step
steps:
  - name: fetch-data
    script: cd /home/ubuntu/works/lobster-automation/projects-list/my-project && npm run fetch
    retry:
      max_attempts: 3
      backoff_ms: [5000, 15000, 30000]
      backoff_mode: exponential

# ❌ WRONG — retry as its own step type does not exist in the schema
steps:
  - name: retry-fetch
    retry:
      max_attempts: 3
      backoff_ms: [5000, 15000]
```

---

### Rule 4 — `backoff_mode` Must Be `linear` or `exponential` (lowercase)

The schema enforces an exact enum: `['linear', 'exponential']`

```yaml
# ✅ Correct
retry:
  backoff_mode: exponential

# ❌ WRONG — these all fail validation
backoff_mode: "exponential"   # quoted string is unnecessary
backoff_mode: "exp"           # wrong value
backoff_mode: true            # wrong type
```

`backoff_ms` can be a single number OR an array:
```yaml
# Both are valid
retry:
  max_attempts: 3
  backoff_ms: 5000              # single number → grows as: 5000, 10000, 20000...
  backoff_mode: exponential

retry:
  max_attempts: 3
  backoff_ms: [5000, 15000, 30000]  # array → use each value directly
  backoff_mode: exponential
```

---

### Rule 5 — Always `cd` to the Project Root in `script:`

The `script:` field runs via `node:child_process exec()` with no guaranteed working directory.

```yaml
# ✅ CORRECT — cd to project root first
steps:
  - name: backup
    script: cd /home/ubuntu/works/lobster-automation/projects-list/MyTasks && npx tsx scripts/backup-tasks.ts

# ❌ WRONG — no cd
    script: npx tsx scripts/backup-tasks.ts

# ❌ WRONG — assumes cwd is already the project dir
    script: npm run backup
```

**Rule: every `script:` must start with `cd /home/ubuntu/works/lobster-automation/projects-list/<PROJECT> && `**

---

### Rule 6 — YAML File Location and Full Path Is Part of the Contract

The lobster server auto-discovers flows from:
```
/home/ubuntu/works/lobster-automation/projects-list/<project-name>/taskflows/<flow-name>.yaml
```

The full path is `/home/ubuntu/works/lobster-automation/projects-list/`. Do NOT use relative
paths like `./projects-list/` or `~/projects-list/` or any variation.

```
/home/ubuntu/works/lobster-automation/projects-list/
  my-project/
    taskflows/
      my-flow.yaml      ← server loads this
    scripts/
      doThing.ts
    package.json         ← must have tsx as devDependency
```

If the YAML is not in a `taskflows/` subdirectory of a project folder, the server **will not find it**.

---

### Rule 7 — `triggers` Is for Webhook and Manual, Not Cron

Cron triggers are automatic from `schedule:` — you don't add them to `triggers`. The `triggers` section is only for:
- `webhook` — external services call the flow via HTTP
- `manual` — fire the flow manually via `POST /run/<name>`

```yaml
# ✅ Correct — webhook trigger for external calls
triggers:
  - type: webhook
    name: my-webhook-flow

# ❌ Wrong — cron in triggers (cron comes from schedule: at flow level)
triggers:
  - type: cron
    name: my-cron
```

---

## Webhooks via ewizt.com Relay (The Right Way)

**The Problem:** Lobster runs on `localhost:3099` behind WSL2, which has no public IP. You cannot expose it directly to the internet.

**The Solution:** The ewizt relay system. It's already running and is the preferred way to receive webhooks from external services (Telegram, GitHub, etc.).

### How It Works

```
External Service (Telegram, GitHub, etc.)
    │
    ▼ POST to:
https://ewizt.com/relay/webhook/<flow-name>
    │
    ▼ (immediate 202 response)
PHP webhook receiver (ewizt-backup-repo/webroot/relay/webhook.php)
    │
    ▼ writes to SQLite queue
/home/ubuntu/works/lobster-automation/projects-list/wsl-house-clean/ewizt-backup-repo/webroot/relay/queue.sqlite
    │
    │  (meanwhile, immediately returns 202 to Telegram)
    │
Lobster relay poller (server/src/server.ts) — long-polls ewizt.com/relay/poll
    │
    ▼ receives {flow_name, payload, run_id}
Lobster executes the flow, passing payload as trigger_payload
    │
    ▼ (if Telegram reply needed)
Script step sends reply via Telegram Bot API directly
```

**Key insight:** The flow's script step is responsible for sending any reply back to Telegram. The webhook is fire-and-forget from Telegram's perspective — Telegram gets a 202 immediately, and the flow handles the response asynchronously.

### The Relay Endpoints

| URL | What It Does |
|-----|-------------|
| `https://ewizt.com/relay/webhook/<flow-name>` | External services POST here. Writes to queue, returns immediately. |
| `https://ewizt.com/relay/poll` | Lobster long-polls this. Returns queued webhooks. |
| `https://ewizt.com/relay/result/<run_id>` | Script posts result back (optional, for async result tracking). |

**Relay token:** `NsufkdwqJWfr4GwFko7R` (used in `X-Relay-Token` header for poll/result).

### Setting Up a New Webhook Flow

**Step 1 — Create the YAML with a webhook trigger:**

```yaml
name: my-webhook-flow
description: Handles incoming commands from Telegram via ewizt relay.

triggers:
  - type: webhook
    name: my-webhook-flow
    secret: ""  # optional, used if you want to validate requests

steps:
  - name: handle
    script: cd /home/ubuntu/works/lobster-automation/projects-list/<project> && npx tsx scripts/my-handler.ts
    timeout_seconds: 55
    # Note: the webhook payload is available as the trigger_payload in the run record.
    # The script should read it from stdin, a temp file, or the script can fetch the
    # Telegram update from the Bot API directly.

on_failure:
  notify: telegram
  message: "⚠️ my-webhook-flow failed"
```

**Step 2 — Register the flow (automatic on reload):**
```bash
curl -s -X POST http://localhost:3099/flows/reload | python3 -m json.tool
```

**Step 3 — Point the external service at ewizt:**

```bash
# Example: set Telegram bot webhook
curl -s -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook"
  -d "url=https://ewizt.com/relay/webhook/my-webhook-flow&allowed_updates=message,callback_query"
```

**For Telegram specifically:** The bot token and allowed chat IDs are configured in the script that handles the command. The ewizt relay just passes the webhook POST through — Telegram never talks directly to lobster.

### Important Constraints for Webhook Flows

1. **Telegram requires 60s response time.** Lobster's relay poller returns the webhook to lobster quickly, but the flow's `timeout_seconds` should be ≤55s to be safe.

2. **Telegram replies go through Bot API directly.** The flow's script must call `https://api.telegram.org/bot<TOKEN>/sendMessage` itself. Lobster does not relay Telegram responses.

3. **The trigger_payload is stored in the run record.** It's available to lobster's internal processing but NOT automatically passed to script steps as env vars or args. If your script needs the webhook payload, either:
   - Have the external service include a `run_id` that maps to stored data
   - Or design the script to fetch the data it needs (e.g., Telegram Bot API `getUpdates`)

4. **Do NOT try to expose lobster directly via cloudflared/ngrok tunnels.** The ewizt relay exists precisely to avoid this. Use the relay.

### Existing Webhook Flow Reference

The `MyTasks/task-commands.yaml` flow receives `/task-today`, `/task-dis`, etc. via the ewizt relay. Its handler script (`telegram-command-handler.ts`) receives the Telegram update and sends replies directly via the Bot API.

---

## Five Step Types Exist (and Only These)

Read `references/schema.md` for the exact shape of each. The short version:

| Step Type | Key in YAML | When to Use |
|---|---|---|
| `script` | `script: <shell command>` | Run a shell command or npm script |
| `http` | `http: { method, url, ... }` | Make an HTTP request |
| `agent` | `agent: { prompt, model?, timeout_seconds? }` | Call OpenClaw agent |
| `branch` | `branch: { condition, on_true, on_false }` | Conditional branching |
| *(retry)* | `retry: {...}` **inside** a script step | Retry on failure |

There is no `cron:`, `schedule:`, `trigger:` as step keys — those belong at the **flow level**.

---

### Rule 8 — `on_failure` and `on_success` Use Notify Values Exactly

Valid notify values (schema enum): `telegram` | `slack` | `discord` | `email`

```yaml
# ✅ Correct
on_failure:
  notify: telegram
  message: "⚠️ my-flow failed at step: {step}"

on_success:
  notify: telegram
  message: "✅ my-flow completed"

# ❌ WRONG — invalid notify values
  notify: "tg"        # not a valid enum value
  notify: true        # wrong type
  notify: "slackbot"  # not a valid enum value
```

The `{step}` placeholder in `on_failure` messages is replaced with the name of the step
that failed. `notify` is optional — if omitted, no notification is sent.

---

### Rule 9 — `depends_on` Must Reference Earlier Steps by `name`

Steps run sequentially by default. Use `depends_on` to run in parallel:

```yaml
steps:
  - name: fetch-ai
    script: cd /home/ubuntu/works/lobster-automation/projects-list/my-project && npm run fetch:ai

  - name: fetch-tech
    script: cd /home/ubuntu/works/lobster-automation/projects-list/my-project && npm run fetch:tech

  - name: merge          # runs AFTER both fetch steps complete
    script: cd /home/ubuntu/works/lobster-automation/projects-list/my-project && npm run merge
    depends_on: [fetch-ai, fetch-tech]
```

**No circular dependencies.** If A depends on B and B depends on A, the flow will fail with a confusing "missing deps" error.

---

### Rule 10 — Scripts Must Be Created Too

Writing the YAML is not enough. **Every `script:` command must correspond to a real file.**

If you write:
```yaml
- name: do-something
  script: cd /home/ubuntu/works/lobster-automation/projects-list/my-project && npx tsx scripts/do-something.ts
```

You MUST also create:
```
/home/ubuntu/works/lobster-automation/projects-list/my-project/scripts/do-something.ts
/home/ubuntu/works/lobster-automation/projects-list/my-project/package.json   ← must have tsx as devDependency
```

---

## Complete Workflow: Create → Validate → Reload → Verify → Trigger

> ⚠️ Do NOT copy from `project-template/taskflows/example-flow.yaml` — its `script:` entries
> are missing the required `cd` step. Always copy from `examples.md` or the template below.

### Step 1 — Write the YAML

Follow all 10 rules above. Use `references/schema.md` for exact field shapes.
Use `references/examples.md` for real working YAML to copy from.

### Step 2 — Validate Before Committing

**Always validate before writing the YAML to disk.** Call the `/validate` endpoint:

```
POST http://localhost:3099/validate
Content-Type: application/json

{ "yaml": "<full YAML content as a string>" }
```

Example:
```bash
curl -s -X POST http://localhost:3099/validate \
  -H "Content-Type: application/json" \
  -d '{"yaml": "name: my-flow\ndescription: ...\nschedule:\n  cron: \"30 23 * * *\"\n  timezone: Asia/Kuala_Lumpur\nsteps:\n  - name: step1\n    script: cd /home/ubuntu/works/lobster-automation/projects-list/my-project && npx tsx scripts/step1.ts\non_failure:\n  notify: telegram\n  message: \"⚠️ my-flow failed\""}'

# ✅ Expected response:
# { "ok": true, "flow": { ...parsed flow... } }

# ❌ If errors:
# { "ok": false, "errors": ["steps.0.script: required", "schedule.cron: invalid cron expression"] }
```

**Fix all errors before proceeding.** Do not write the YAML to disk if `/validate` returns errors.

### Step 3 — Place the YAML Correctly

```
/home/ubuntu/works/lobster-automation/projects-list/<project-name>/taskflows/<flow-name>.yaml
```

If the project or directories don't exist, create them:
```
projects-list/
  my-project/
    taskflows/
    scripts/
    package.json
```

### Step 4 — Ensure Dependencies

In the project directory:
```bash
cd /home/ubuntu/works/lobster-automation/projects-list/my-project
npm install   # installs tsx, googleapis, etc.
```

The `package.json` must have `tsx` as a devDependency (for `npx tsx`).

### Step 5 — Reload the Registry

```bash
curl -s -X POST http://localhost:3099/flows/reload | python3 -m json.tool
```

This tells the server to rescan all `taskflows/` directories and pick up the new YAML.
Response:
```json
{
  "ok": true,
  "loaded": 12,
  "flow_count": 12,
  "flows": ["my-flow", "daily-mytasks-backup", ...],
  "errors": []
}
```

### Step 6 — Verify the Flow Is Registered

**Check 1 — Flow appears in the registry:**
```bash
curl -s http://localhost:3099/flows | python3 -m json.tool
# Should include your flow name
```

**Check 2 — Schedule is registered (if scheduled):**
```bash
curl -s http://localhost:3099/schedules | python3 -m json.tool
# Look for your flow name. Check that next_run_at is NOT "unknown"
```

If `next_run_at` is `"unknown"`, the cron expression may have failed to parse.
Check the cron is 5 fields (Rule 2) and the timezone is a valid IANA string.

**Check 3 — Full schedule details:**
```bash
curl -s http://localhost:3099/schedules/my-flow | python3 -m json.tool
```

This returns:
- `schedule.name` — flow name
- `schedule.cron` — the cron expression
- `schedule.timezone` — timezone
- `schedule.next_run_at` — next scheduled run (ISO string, not "unknown")
- `schedule.enabled` — whether the schedule is active
- `schedule.last_run_status` — result of last run (if any)
- `recent_runs` — last 20 run records

### Step 7 — Test-Fire the Flow

**For scheduled flows (any flow with `schedule:`):**
```bash
curl -s -X POST http://localhost:3099/schedules/my-flow/run | python3 -m json.tool
# Response: { "run_id": "abc-123" }
```

**For flows with `triggers:` section:**
```bash
curl -s -X POST http://localhost:3099/run/my-flow | python3 -m json.tool
# Response: { "run_id": "abc-123" }
```

### Step 8 — Check Run Results

```bash
# Get run status and step results
curl -s http://localhost:3099/runs/<run_id> | python3 -m json.tool
```

This returns:
- `run.status` — `running` | `success` | `fail` | `cancelled`
- `steps` — array of each step with `step_name`, `status`, `output_result`, `error_message`, `duration_ms`

**If a step failed:**
```bash
# Replay from the failed step (keeps previous step results)
curl -s -X POST http://localhost:3099/runs/<run_id>/replay | python3 -m json.tool
```

---

## Server Endpoints Reference

Base URL: `http://localhost:3099` (local dev) or `https://ewizt.com/lobster` (production)

| Method | Endpoint | What It Does |
|--------|----------|--------------|
| `GET` | `/flows` | List all registered flow names |
| `POST` | `/flows/reload` | Rescan taskflows/ directories — reloads registry |
| `POST` | `/validate` | Validate YAML without loading it. Body: `{ yaml: "..." }` |
| `GET` | `/schedules` | List all scheduled flows with status and next run time |
| `GET` | `/schedules/:name` | Full details for one scheduled flow + recent runs |
| `POST` | `/schedules/:name/run` | Fire a scheduled flow immediately (test fire) |
| `POST` | `/schedules/:name/enable` | Enable a disabled schedule |
| `POST` | `/schedules/:name/disable` | Disable a schedule (skips next cron tick) |
| `POST` | `/run/:name` | Fire any flow by name (manual or webhook trigger) |
| `GET` | `/runs` | List recent runs (limit via `?limit=N`) |
| `GET` | `/runs/:id` | Full run details including step results |
| `POST` | `/runs/:id/replay` | Replay from first failed step |
| `GET` | `/health` | Server health check |

---

## Troubleshooting

**`/validate` returns errors:**
- Read the error list carefully — each error says exactly which field is wrong
- Common causes: missing `script:` key, wrong `backoff_mode` spelling, invalid cron
- **Always fix YAML errors before writing to disk**

**Flow doesn't appear in `/flows`:**
- YAML is not in `projects-list/*/taskflows/*.yaml` — check the path (Rule 6)
- Did you call `POST /flows/reload` after adding the file?
- Check the lobster server logs for YAML parse errors

**`next_run_at: "unknown"` in `/schedules`:**
- Cron expression is 5 fields only — did you accidentally add a 6th field (seconds)?
- Timezone must be a valid IANA string like `Asia/Kuala_Lumpur` — not `MYT` or `GMT+8`
- Check the lobster server logs for cron parse warnings

**Step fails with "missing deps":**
- Every name in `depends_on` must exactly match an earlier step's `name` (Rule 9)
- Check for typos and case sensitivity
- Look for circular dependencies (A→B→C→A)

**Step always fails but works when run manually:**
- The `cd` path in `script:` is probably wrong (Rule 5)
- `node_modules` not installed — run `npm install` in the project directory
- Script has a hardcoded working directory assumption

**Step fails with "script not found":**
- The `npx tsx` command can't find the script file
- Check the path after `cd` is correct and the `.ts` file exists there

**Webhook flow not receiving events:**
- **Never try cloudflared/ngrok/localtunnel** to expose lobster directly — use the ewizt relay
- Did you point the external service at `https://ewizt.com/relay/webhook/<flow-name>`?
- Check `https://ewizt.com/relay/relay-log.jsonl` for incoming webhook events
- Check lobster server logs for relay poller activity
- Telegram bot: verify webhook is set with `GET https://api.telegram.org/bot<TOKEN>/getWebhookInfo`
- Telegram requires ≤60s response — ensure `timeout_seconds` on webhook steps is ≤55

---

## When Something Goes Wrong

1. **Start with `/validate`** — paste your YAML and fix all errors
2. **Check `/flows`** — is the flow name there?
3. **Check `/schedules/:name`** — is `next_run_at` a real ISO time, not "unknown"?
4. **Check `/runs/:id`** — which exact step failed and what was the error?
5. **Read the lobster server logs** — they're the source of truth for parse failures

**Don't guess.** Walk through this sequence in order.
