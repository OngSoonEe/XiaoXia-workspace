---
name: lobster-authoring
description: >
  Use when creating, modifying, or fixing Lobster automation workflows (taskflow YAML files
  in lobster-automation projects). Triggers on: "create a lobster workflow", "add a cron
  schedule", "build an automation", "fix the taskflow", "lobster automation", "workflow
  YAML", "step runner", or when asked to author/edit any .yaml file under
  projects-list/*/taskflows/. This skill is the single source of truth for lobster
  authoring — any AI working on lobster workflows must read this skill before writing
  ANY YAML.
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
`projects-list/*/taskflows/`. To register a new cron:

1. Write the YAML to the correct path (see Rule 6)
2. Trigger a flow reload — how depends on the deployment:

| Deployment | How to Reload |
|---|---|
| Dev (local) | `openclaw tasks run reload-flows` or restart the server |
| Production (ewizt.com) | POST to `https://ewizt.com/relay` with the relay token, or trigger via the relay poller |

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
    script: npm run fetch
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
backoff_mode: "exponential"   # quoted string still works but don't quote
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

# ❌ WRONG — relative path, no cd
    script: npx tsx scripts/backup-tasks.ts

# ❌ WRONG — assumes cwd is already the project dir
    script: npm run backup
```

**Rule: every `script:` must start with `cd <absolute-path> && `**

---

### Rule 6 — YAML File Location Is Part of the Contract

Flows are auto-discovered from: `projects-list/<project-name>/taskflows/<flow-name>.yaml`

```
projects-list/
  my-project/
    taskflows/
      my-flow.yaml      ← server loads this
    scripts/
      doThing.ts
    package.json
```

If the YAML is not in a `taskflows/` subdirectory of a project folder, the server **will not find it**.

---

### Rule 7 — Five Step Types Exist (and Only These)

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

The `{step}` placeholder in failure messages is replaced with the failed step name.

---

### Rule 9 — `depends_on` Must Reference Earlier Steps by `name`

Steps run sequentially by default. Use `depends_on` to run in parallel:

```yaml
steps:
  - name: fetch-ai
    script: cd ... && npm run fetch:ai

  - name: fetch-tech
    script: cd ... && npm run fetch:tech

  - name: merge          # runs AFTER both fetch steps complete
    script: cd ... && npm run merge
    depends_on: [fetch-ai, fetch-tech]
```

**No circular dependencies.** If A depends on B and B depends on A, the flow will fail with a confusing "missing deps" error.

---

### Rule 10 — Scripts Must Be Created Too

Writing the YAML is not enough. **Every `script:` command must correspond to a real file.**

If you write:
```yaml
- name: do-something
  script: cd /path/to/project && npx tsx scripts/do-something.ts
```

You MUST also create:
```
projects-list/my-project/scripts/do-something.ts
projects-list/my-project/package.json   ← must list this as a script or have tsx available
```

---

## Workflow: Creating a New Lobster Flow

1. **Read `references/schema.md`** — know the exact field shapes before writing YAML
2. **Read `references/examples.md`** — copy the closest existing flow as a base
3. **Place the YAML** in `projects-list/<name>/taskflows/<name>.yaml`
4. **Create the scripts** referenced in the YAML under `projects-list/<name>/scripts/`
5. **Ensure `package.json`** has the necessary dependencies (at minimum `tsx`)
6. **Run `npm install`** in the project directory
7. **Trigger a reload** — see Rule 1

---

## When Something Goes Wrong

**YAML won't load or cron doesn't fire:**
- Run the validator: check `references/schema.md` against what you wrote
- Make sure the YAML is in `projects-list/*/taskflows/*.yaml`
- Make sure cron is 5 fields only (Rule 2)

**Step fails with "missing deps":**
- Check that every name in `depends_on` matches an earlier step's `name` exactly (Rule 9)
- Check for circular dependencies (Rule 9)

**Step always fails but works manually:**
- Check the `cd` path in `script:` is correct (Rule 5)
- Check `node_modules` are installed (`npm install` was run)
- Add `retry:` to handle transient failures (Rule 3 + Rule 4)

**Don't guess.** If you're unsure, read the reference files first.
