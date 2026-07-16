# Lobster Taskflow Schema — Authoritative Reference

This is the actual Zod schema the lobster server uses to validate YAML.
Copy the shapes exactly. Do not improvise field names.

---

## Flow Definition

```typescript
FlowDefinitionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  schedule: ScheduleConfigSchema.optional(),
  triggers: z.array(TriggerConfigSchema).optional(),
  steps: z.array(StepSchema),
  on_success: HookConfigSchema.optional(),
  on_failure: HookConfigSchema.optional(),
})
```

---

## Schedule Config

```typescript
ScheduleConfigSchema = z.object({
  cron: z.string(),       // 5-field cron expression, required if schedule exists
  timezone: z.string().optional(),  // IANA timezone, e.g. "Asia/Kuala_Lumpur"
})
```

**Important:** `schedule` is a **flow-level** key, not a step key. It goes at the same
indent level as `name`, `description`, `steps`.

```yaml
# ✅ Correct placement
name: my-flow
description: Does things
schedule:
  cron: "0 9 * * *"
  timezone: Asia/Kuala_Lumpur
steps:
  [...]

# ❌ Wrong — schedule indented under steps
steps:
  schedule:
    cron: "0 9 * * *"
```

---

## Triggers Config

```typescript
TriggerConfigSchema = z.object({
  type: z.enum(['cron', 'webhook', 'manual']),
  name: z.string(),
  secret: z.string().optional(),
})
```

- `cron` triggers are automatic from `schedule.cron` — you don't add them here
- `webhook` lets external services trigger the flow
- `manual` lets you trigger via HTTP POST to `/run/<flow-name>`

```yaml
triggers:
  - type: webhook
    name: my-webhook
  - type: manual
    name: my-manual
```

---

## Steps — Five Types

### 1. Script Step (most common)

```typescript
ScriptStepSchema = z.object({
  name: z.string(),
  script: z.string(),
  description: z.string().optional(),
  depends_on: z.array(z.string()).optional(),
  retry: RetryConfigSchema.optional(),
  timeout_seconds: z.number().int().positive().optional(),  # default: 300
})
```

```yaml
steps:
  - name: fetch-news
    script: cd /home/ubuntu/works/lobster-automation/projects-list/my-project && npx tsx scripts/fetch-news.ts
    description: Fetch latest news from API
    timeout_seconds: 600
    retry:
      max_attempts: 3
      backoff_ms: [5000, 15000, 30000]
      backoff_mode: exponential
```

---

### 2. HTTP Step

```typescript
HttpStepSchema = z.object({
  name: z.string(),
  http: z.object({
    method: z.string(),           # GET | POST | PUT | PATCH | DELETE
    url: z.string(),
    headers: z.record(z.string()).optional(),
    body: z.unknown().optional(),
    on_failure: z.string().optional(),  # step name to jump to on failure
  }),
  depends_on: z.array(z.string()).optional(),
})
```

```yaml
steps:
  - name: call-api
    http:
      method: POST
      url: https://api.example.com/data
      headers:
        Authorization: "Bearer {token}"
        Content-Type: "application/json"
      body:
        key: value
```

---

### 3. Agent Step

```typescript
AgentStepSchema = z.object({
  name: z.string(),
  agent: z.object({
    prompt: z.string(),
    model: z.string().optional(),
    timeout_seconds: z.number().int().positive().optional(),
  }),
  depends_on: z.array(z.string()).optional(),
})
```

```yaml
steps:
  - name: classify-content
    agent:
      prompt: "Classify this article as AI, Tech, or Other: {result.body}"
      model: ollama/minimax-m2.7:cloud
      timeout_seconds: 300
```

---

### 4. Branch Step

```typescript
BranchStepSchema = z.object({
  name: z.string(),
  branch: z.object({
    condition: z.string(),        # JavaScript expression evaluated against previousResults
    on_true: z.array(z.string()),  # step names to run if condition is true
    on_false: z.array(z.string()), # step names to run if condition is false
  }),
  depends_on: z.array(z.string()).optional(),
})
```

```yaml
steps:
  - name: check-result
    branch:
      condition: "result.status === 'ok'"
      on_true: [process-data]
      on_false: [alert-failure]
```

The `condition` is a JavaScript expression evaluated with `previousResults` in scope.
Example: `previousResults['fetch-data'].items.length > 0`

---

### 5. Retry Config (inline on script steps only)

```typescript
RetryConfigSchema = z.object({
  max_attempts: z.number().int().positive(),
  backoff_ms: z.union([
    z.array(z.number().int().nonnegative()),
    z.number().int().nonnegative(),
  ]),
  on_retry: z.string().optional(),
  backoff_mode: z.enum(['linear', 'exponential']).optional(),
})
```

**retry is NOT a standalone step.** It must be nested inside a `script` step:

```yaml
# ✅ Correct — retry inside script step
- name: upload
  script: cd ... && npm run upload
  retry:
    max_attempts: 3
    backoff_ms: [5000, 15000, 30000]
    backoff_mode: exponential

# ❌ Wrong — retry as its own step
- name: retry-upload
  retry:
    max_attempts: 3
    backoff_ms: [5000, 15000]
```

---

## Hook Config (`on_failure` / `on_success`)

```typescript
HookConfigSchema = z.object({
  notify: z.enum(['telegram', 'slack', 'discord', 'email']).optional(),
  message: z.string().optional(),
})
```

```yaml
on_failure:
  notify: telegram
  message: "⚠️ my-flow failed at step: {step}"

on_success:
  notify: telegram
  message: "✅ my-flow completed"
```

The `{step}` placeholder in `on_failure` messages is replaced with the name of the step
that failed. `notify` is optional — if omitted, no notification is sent.

---

## Complete Minimal Flow Example

```yaml
name: example-flow
description: >
  A minimal example flow demonstrating all valid structure.

schedule:
  cron: "0 9 * * *"
  timezone: Asia/Kuala_Lumpur

triggers:
  - type: manual
    name: example-now

steps:
  - name: fetch
    script: cd /home/ubuntu/works/lobster-automation/projects-list/example && npm run fetch
    retry:
      max_attempts: 2
      backoff_ms: 5000
      backoff_mode: exponential

  - name: process
    script: cd /home/ubuntu/works/lobster-automation/projects-list/example && npm run process
    depends_on: [fetch]

  - name: notify
    script: cd /home/ubuntu/works/lobster-automation/projects-list/example && npm run notify
    depends_on: [process]

on_failure:
  notify: telegram
  message: "⚠️ example-flow failed"

on_success:
  notify: telegram
  message: "✅ example-flow completed"
```

---

## Common Mistakes (Quick Checklist)

- [ ] Cron is exactly 5 fields: `minute hour dom month dow`
- [ ] `retry` is nested inside `script` steps, not a separate step
- [ ] `backoff_mode` is `linear` or `exponential` (lowercase, no quotes needed)
- [ ] `script:` starts with `cd <absolute-path> &&`
- [ ] YAML is in `projects-list/<name>/taskflows/<name>.yaml`
- [ ] `depends_on` step names match exactly (case-sensitive)
- [ ] `notify` values are: `telegram` | `slack` | `discord` | `email`
- [ ] `schedule:` is at flow level, not inside `steps:`
- [ ] `timeout_seconds` is a number (seconds), not milliseconds
