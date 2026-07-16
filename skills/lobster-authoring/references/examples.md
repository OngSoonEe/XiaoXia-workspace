# Lobster Taskflow Examples — Working References

These are real, production workflows. Copy their structure exactly.

---

## Example 1: Simple Daily Backup (MyTasks — backup only)

From: `projects-list/MyTasks/taskflows/daily-mytasks-backup.yaml`

```yaml
name: daily-mytasks-backup
description: >
  Daily backup of all Google Tasks to JSON (uploaded to Drive/MyTasksBackup/)
  and upload of daily command activity log CSV to Drive/MyTasksBackup/.
  Runs at 11:30 PM daily (Asia/Kuala_Lumpur).

schedule:
  cron: "30 23 * * *"
  timezone: Asia/Kuala_Lumpur

steps:
  - name: backup-tasks
    description: >
      Fetch all tasks from every Google Tasks list and save as JSON
      matching the exported_tasks.json format, then upload to Drive/MyTasksBackup/.
    script: cd /home/ubuntu/works/lobster-automation/projects-list/MyTasks && npx tsx scripts/backup-tasks.ts
    retry:
      max_attempts: 3
      backoff_ms: [5000, 15000, 30000]
      backoff_mode: exponential

  - name: upload-activity-log
    description: >
      Upload today's command activity log CSV to Drive/MyTasksBackup/.
      Creates the CSV header on first run.
    script: cd /home/ubuntu/works/lobster-automation/projects-list/MyTasks && npx tsx scripts/log-activity.ts
    depends_on:
      - backup-tasks
    retry:
      max_attempts: 3
      backoff_ms: [5000, 15000, 30000]
      backoff_mode: exponential

on_failure:
  notify: telegram
  message: "⚠️ daily-mytasks-backup failed — check logs"

on_success:
  notify: telegram
  message: "✅ daily-mytasks-backup completed — tasks backed up + activity log uploaded"
```

---

## Example 2: Multi-Branch Pipeline with Parallel Fetches

From: `projects-list/daily-personal-tech-news/taskflows/daily-personal-tech-news.yaml` (abbreviated)

```yaml
name: daily-personal-tech-news
description: >
  Daily AI & Tech news pipeline. Fetches AI and tech news from NewsAPI + RSS,
  normalizes, selects via LLM, generates hero image, renders HTML page and email,
  uploads to ewizt.com, emails recipients, and sends Telegram notification.

schedule:
  cron: "0 9 * * *"
  timezone: Asia/Kuala_Lumpur

steps:
  # ── Parallel fetches ──────────────────────────────────────────
  - name: fetch-ai
    script: cd /home/ubuntu/works/lobster-automation/projects-list/daily-personal-tech-news && npm run fetch:ai
    description: Fetch AI news from NewsAPI

  - name: fetch-tech
    script: cd /home/ubuntu/works/lobster-automation/projects-list/daily-personal-tech-news && npm run fetch:tech
    description: Fetch tech news from NewsAPI

  - name: fetch-rss
    script: cd /home/ubuntu/works/lobster-automation/projects-list/daily-personal-tech-news && npm run fetch:rss
    description: Fetch articles from RSS/JSON feeds

  # ── Merge waits for all three ────────────────────────────────
  - name: merge
    script: cd /home/ubuntu/works/lobster-automation/projects-list/daily-personal-tech-news && npm run merge
    depends_on: [fetch-ai, fetch-tech, fetch-rss]
    description: Merge and deduplicate NewsAPI + RSS articles

  # ── Parallel normalization ────────────────────────────────────
  - name: normalize-ai
    script: cd /home/ubuntu/works/lobster-automation/projects-list/daily-personal-tech-news && npm run normalize:ai
    depends_on: [merge]
    description: Normalize and clean AI articles

  - name: normalize-tech
    script: cd /home/ubuntu/works/lobster-automation/projects-list/daily-personal-tech-news && npm run normalize:tech
    depends_on: [merge]
    description: Normalize and clean tech articles

  # ── Dedup waits for both normalizations ─────────────────────
  - name: dedup
    script: cd /home/ubuntu/works/lobster-automation/projects-list/daily-personal-tech-news && npm run dedup
    depends_on: [normalize-ai, normalize-tech]
    description: Cross-section deduplication (ai > tech)

  # ── LLM selection (with timeout + retry) ────────────────────
  - name: select-ai
    script: cd /home/ubuntu/works/lobster-automation/projects-list/daily-personal-tech-news && npm run select:ai
    depends_on: [dedup]
    description: LLM selects 8 AI articles
    timeout_seconds: 600
    retry:
      max_attempts: 2
      backoff_ms: 5000
      backoff_mode: exponential

  - name: select-tech
    script: cd /home/ubuntu/works/lobster-automation/projects-list/daily-personal-tech-news && npm run select:tech
    depends_on: [dedup]
    description: LLM selects 8 tech articles
    timeout_seconds: 600
    retry:
      max_attempts: 2
      backoff_ms: 5000
      backoff_mode: exponential

  # ── Final steps ──────────────────────────────────────────────
  - name: notify
    script: cd /home/ubuntu/works/lobster-automation/projects-list/daily-personal-tech-news && npm run notify
    depends_on: [upload]
    description: Send Telegram notification

on_failure:
  notify: telegram
  message: "⚠️ daily-personal-tech-news pipeline failed at step: {step}"

on_success:
  notify: telegram
  message: "✅ daily-personal-tech-news pipeline completed successfully"
```

---

## Example 3: Webhook-Triggered Flow

From: `projects-list/customizable-news/taskflows/whatsapp-subscribe-flow.yaml`

```yaml
name: whatsapp-subscribe-flow
description: >
  Process WhatsApp subscription requests for daily general news.
  Notifies Jack via Telegram for approval. Once approved, the number
  is added to the daily WhatsApp notification list.

triggers:
  - type: webhook
    name: whatsapp-subscribe-flow

steps:
  - name: notify-telegram
    script: cd /home/ubuntu/works/lobster-automation/projects-list/customizable-news && npx tsx scripts/notify-subscribe-review.ts

on_failure:
  notify: telegram
  message: "⚠️ whatsapp-subscribe-flow failed"

on_success:
  notify: telegram
  message: "✅ whatsapp-subscribe-flow completed — Jack notified of new subscription request"
```

---

## Example 4: HTTP Step (no script)

```yaml
name: http-check-flow
description: Health check via HTTP GET

steps:
  - name: health-check
    http:
      method: GET
      url: https://ewizt.com/health
      timeout_ms: 5000
    retry:
      max_attempts: 3
      backoff_ms: [1000, 3000, 10000]
      backoff_mode: exponential

  - name: alert-if-down
    script: echo "Service is down!"
    depends_on: [health-check]
    branch:
      condition: "previousResults['health-check'].status >= 400"
      on_true: [alert-if-down]
      on_false: []
```

---

## Example 5: Branch Step

```yaml
steps:
  - name: decide
    branch:
      condition: "previousResults['fetch'].items.length > 0"
      on_true: [process-items]
      on_false: [notify-empty]

  - name: process-items
    script: cd ... && npm run process
    depends_on: [decide]

  - name: notify-empty
    script: cd ... && npm run notify-empty
    depends_on: [decide]
```

---

## Example 6: Agent Step

```yaml
steps:
  - name: summarize
    agent:
      prompt: "Summarize the following article in 3 sentences: {previousResults['fetch-article'].body}"
      model: ollama/minimax-m2.7:cloud
      timeout_seconds: 120
    depends_on: [fetch-article]
```

---

## Template: Start Here for New Flows

Copy this template when creating a new workflow:

```yaml
name: my-new-flow
description: >
  One sentence describing what this automation does.
  Keep it concise.

schedule:
  cron: "0 9 * * *"        # Run daily at 9 AM MYT — EDIT THIS
  timezone: Asia/Kuala_Lumpur

# triggers:               # Only add if you need manual or webhook trigger
#   - type: manual
#     name: my-new-flow-now

steps:
  - name: step-one
    script: cd /home/ubuntu/works/lobster-automation/projects-list/<PROJECT>/ && npx tsx scripts/step-one.ts
    description: Do the first thing
    retry:
      max_attempts: 2
      backoff_ms: 5000
      backoff_mode: exponential

  - name: step-two
    script: cd /home/ubuntu/works/lobster-automation/projects-list/<PROJECT>/ && npx tsx scripts/step-two.ts
    depends_on: [step-one]
    description: Do the second thing

on_failure:
  notify: telegram
  message: "⚠️ my-new-flow failed at step: {step}"

on_success:
  notify: telegram
  message: "✅ my-new-flow completed"
```

---

## Cron Expression Cheat Sheet

| Schedule | Cron Expression |
|---|---|
| Every day 9:00 AM MYT | `0 9 * * *` |
| Every day 11:30 PM MYT | `30 23 * * *` |
| Every Monday 9 AM MYT | `0 9 * * 1` |
| Every 15 minutes | `*/15 * * * *` |
| Every hour | `0 * * * *` |
| Twice daily (9 AM & 9 PM) | `0 9,21 * * *` |
| First day of month at midnight | `0 0 1 * *` |
| Weekdays only at 9 AM | `0 9 * * 1-5` |

MYT = Asia/Kuala_Lumpur = UTC+8. To convert: MYT-8 = UTC.
