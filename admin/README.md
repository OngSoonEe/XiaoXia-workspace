# OpenClaw SW Factory — Complete User Guide

## Table of Contents

- [What is the SW Factory?](#what-is-the-sw-factory)
- [Core Motivation](#core-motivation)
- [How It Works](#how-it-works)
- [Deep Dive: The Full Picture (9 Points)](#deep-dive-the-full-picture-9-points)
- [Architecture Overview](#architecture-overview)
- [Agent Roles & Phases](#agent-roles--phases)
- [Research Tools](#research-tools)
- [User Guide](#user-guide)
- [Troubleshooting](#troubleshooting)

---

## What is the SW Factory?

The SW Factory is an **agent-based software development orchestration system** built on OpenClaw. It turns a Telegram topic into a project management hub where AI agents handle every stage of the software development lifecycle — from requirements gathering to release marketing.

Instead of manually managing tasks, you simply:
1. Mention `@jackoc1_bot` in a Telegram topic with your project idea
2. The orchestrator spins up the right agent team
3. Agents collaborate, delegate, and produce artifacts (SRS, code, tests, docs)

---

## Core Motivation

### Why Agents? Why Orchestrator?

Traditional workflows require **you** to:
- Break down requirements into tasks
- Assign tasks to developers
- Review code
- Run tests
- Write documentation
- Plan marketing

The SW Factory replaces this manual choreography with **automated agent collaboration**:

| Manual Work | Agent Replacement |
|-------------|-------------------|
| Requirements gathering | `sw_architect` + web research |
| Task breakdown | `sw_planner` + work orders |
| Code writing | `dev` |
| QA & testing | `verifier` |
| Code review | `reviewer` |
| End-to-end testing | `uat` |
| Bug fixes | `debugger` |
| Documentation | `docs` |
| Launch strategy | `marketer` |

### The Orchestrator Advantage

The orchestrator stays in the routing loop — **no agent ever owns a topic directly**. This means:
- You can ask questions like "What phase are we in?" and the orchestrator answers
- You can trigger phase transitions with simple commands
- You can swap in new agents mid-project without reconfiguring routing

---

### Routing Architecture (v3 — Default Agent Model)

New topics route to the **OpenClaw default agent** (`main`) by default, not to orchestrator. This keeps non-project topics out of the factory system.

| Topic Type | Routes To | How |
|------------|-----------|-----|
| New topic (no binding) | `main` (default) | No binding → falls back to first agent in `agents.list` |
| Explicitly bound topic | `orchestrator` | Binding added via `bind_topic.py` or "bind this topic to orchestrator" |

**openclaw.json agents.list order:**
```json
"agents": {
  "list": [
    { "id": "main", ... },        // first = default fallback for unmatched topics
    { "id": "orchestrator", ... } // explicit bindings only
  ]
}
```

**openclaw.json bindings:**
```json
"bindings": [
  { "agentId": "orchestrator", "match": { "peer": { "id": "-1003926859444:topic:1077" } } }
]
```

Only explicitly listed topics route to orchestrator. All other topics go to `main`.

---

### Binding a Topic to Orchestrator

**Option 1 — Natural language (in topic):**

1. Go to the new topic
2. Send: `@jackoc1_bot bind this topic to orchestrator`
3. Orchestrator updates `openclaw.json` and restarts the gateway — topic now routes to orchestrator

**Option 2 — Via command line:**

```bash
python3 ~/code/swfactory/bind_topic.py <topic_id>
```

Example:
```bash
python3 ~/code/swfactory/bind_topic.py 1234
```

The script adds the binding to `openclaw.json` and restarts the gateway. After restart, that topic is permanently routed to orchestrator.

**To get a topic ID:**
- Telegram Desktop/Web URL: `https://t.me/c/123456789/1234` → topic ID is `1234`
- Forward a message from the topic to `@jackoc1_bot` — the topic ID appears in metadata

---

## How It Works

### 1. Project Setup (Init Phase)

**Step 0 — Bind the topic (first time only):**

Before starting a project, ensure the topic routes to orchestrator:

- In the topic, send: `@jackoc1_bot bind this topic to orchestrator`
- Or run: `python3 ~/code/swfactory/bind_topic.py <topic_id>`

This adds the topic → orchestrator binding in `openclaw.json`.

**Step 1 — Start the project:**

User mentions bot in a bound topic:
`@jackoc1_bot let's build a web app for kids`

The orchestrator:
- Extracts the topic ID (e.g., `1077`)
- Determines phase = **Planning**
- Calls `swfactory_scaffold.py <project_name> <topic_id> <repo_url|none> '["sw_architect", "sw_planner"]'`

The scaffold:
- Creates workspace: `~/code/<project_name>/`
- Writes `SKILL.md`, `TOOLS.md`, `SOUL_sw_architect.md`, `SOUL_sw_planner.md`
- Adds agents to `openclaw.json` `agents.list`
- Routes topic → `orchestrator` binding in `openclaw.json`
- Does **NOT** restart gateway (the orchestrator handles that separately to avoid killing its own session)

After scaffold, the orchestrator:
- Runs `openclaw gateway restart` as a separate step
- Spawns the first phase agent via `sessions_spawn` with the correct model

### 2. Agent Delegation

After scaffold + gateway restart, orchestrator spawns the first agent:

```python
sessions_spawn(
    task="You are the Software Architect for <project>. Read SOUL_sw_architect.md and begin your work.",
    runtime="subagent",
    mode="run",
    cwd="/home/ubuntu/code/<project_name>",
    model="ollama/glm-5.1:cloud"  # Agent-specific model
)
```

The spawned agent reads:
- `requirements/requirements.txt` (your input)
- `SKILL.md` (this project's skill set)
- `SOUL_sw_architect.md` (its role instructions)
- `TOOLS.md` (available research tools: web_search, web_fetch, browser)

It begins working autonomously.

### 3. Collaboration & Handoff

The orchestrator routes all topic messages to itself. When it's time to switch phases:
- You say: "Let's move to Dev"
- Orchestrator calls scaffold with `["dev", "verifier", "reviewer"]` + `--update`
- Scaffold adds new agents (preserves SRS.md, WORK_ORDERS.md)
- Orchestrator spawns `dev` to begin coding
- When dev finishes, tags `@verifier`, who tags `@reviewer`, who tags orchestrator

### 4. Phase Transitions

| Phase | Trigger | Agent Team | Output |
|-------|---------|------------|--------|
| Planning | User asks to plan | `sw_architect`, `sw_planner` | `SRS.md`, `WORK_ORDERS.md`, `ACCEPTANCE_CRITERIA.md` |
| Dev | "Start coding" or "Approve plan" | `dev`, `verifier`, `reviewer` | Source code, tests, reviewed code |
| UAT | "Test it" or "Deep debugging" | `uat`, `debugger` | `UAT_REPORT.md`, bug fixes |
| Release | "Docs" or "Launch" | `docs`, `marketer` | User guides, marketing materials |

You can also use `--update` flag to add agents mid-project without wiping existing work.

---

## Deep Dive: The Full Picture (9 Points)

Here's the complete system architecture, from config to code:

───

### 1. The Stack (5 Layers)

```
┌─────────────────────────────────┐
│  Telegram Topic (user input)     │  ← You chat here
├─────────────────────────────────┤
│  openclaw.json (routing)         │  ← Topic → orchestrator
├─────────────────────────────────┤
│  Orchestrator (SOUL.md + AGENTS) │  ← Decides what to do
├─────────────────────────────────┤
│  swfactory_scaffold.py          │  ← Provisions project + agents
├─────────────────────────────────┤
│  Agent Catalog (YAML)            │  ← 9 agent templates
└─────────────────────────────────┘
```

Every message from every project topic flows through all 5 layers. The Telegram topic is where you interact; everything else happens behind the scenes.

───

### 2. openclaw.json — The Router

This is OpenClaw's master config. The key section for the factory is `bindings`:

```json
"bindings": [
  {
    "match": { "peer": { "id": "-1003926859444:topic:1077" } },
    "agent": "orchestrator"
  },
  {
    "match": { "peer": { "id": "-1003926859444:topic:1264" } },
    "agent": "orchestrator"
  }
]
```

**Every topic routes to the orchestrator.** No topic ever routes directly to a dev or UAT agent. The orchestrator is the single entry point for all project topics. This is by design — it means the orchestrator stays in the loop for every message, enabling phase transitions without reconfiguration.

───

### 3. The Orchestrator — The Brain

Lives in `~/.openclaw/workspace/admin/`. Its files:

| File | Purpose |
|------|---------|
| `SOUL.md` | Who I am, phase playbook, delegation protocol, failure handling |
| `AGENTS.md` | Job description: manage project lifecycles per topic |
| `SKILL.md` | The `scaffold_project` tool — my only tool |
| `MEMORY.md` | Persistent notes across sessions |

When a message hits a topic:

1. OpenClaw matches the binding → routes to orchestrator
2. Orchestrator reads SOUL.md → follows phase playbook
3. Decides: scaffold a new phase? Spawn an agent? Answer directly?

───

### 4. Agent Catalog (YAML) — The Template Factory

`~/.openclaw/sw_agent_catalog.yaml` defines 9 agent templates. Each entry specifies:

- **Agent key** (e.g., `dev`, `uat`, `reviewer`)
- **Model** to use (`ollama/glm-5.1:cloud` or `ollama/minimax-m2.7:cloud`)
- **Role description** (who this agent is)
- **Instructions** (what this agent does when spawned)

When `swfactory_scaffold.py` runs, it reads from this catalog and writes agent-specific `SOUL_<key>.md` files into the project workspace. The catalog is the single source of truth for all agent behavior.

───

### 5. swfactory_scaffold.py — The Provisioner

This is the tool that builds a project. When you ask to start a project, the orchestrator calls:

```bash
python3 /home/ubuntu/.openclaw/swfactory_scaffold.py <project_name> <topic_id> <repo_url|none> '<json_agent_keys>'
```

The scaffold:
1. **Creates** `~/code/<project_name>/` workspace
2. **Writes** `SKILL.md`, `TOOLS.md`, `MEMORY.md`, `PROGRESS.md`, `SOUL_<key>.md` for each agent
3. **Adds** agent entries to `openclaw.json` `agents.list`
4. **Adds** topic binding → `orchestrator` in `openclaw.json` `bindings`
5. **Does NOT restart the gateway** (the orchestrator handles that as a separate step)

The `--update` flag tells it to preserve existing files (SRS.md, WORK_ORDERS.md, code) and only add missing agents.

───

### 6. Phase Scaffolding — What Gets Created Per Phase

| Phase | Files Created |
|-------|--------------|
| Planning | `SOUL_sw_architect.md`, `SOUL_sw_planner.md`, `SKILL.md`, `TOOLS.md` |
| Dev | `SOUL_dev.md`, `SOUL_verifier.md`, `SOUL_reviewer.md` |
| UAT | `SOUL_uat.md`, `SOUL_debugger.md` |
| Release | `SOUL_docs.md`, `SOUL_marketer.md` |

Each phase adds agents without disturbing previous work. The project workspace accumulates agents across the project lifecycle.

───

### 7. Agent Spawning — The Message Loop

After scaffold + gateway restart, the orchestrator spawns the first agent:

```python
sessions_spawn(
    task="You are the Software Architect for <project>. Read SOUL_sw_architect.md and begin your work.",
    runtime="subagent",
    mode="run",
    cwd="/home/ubuntu/code/<project_name>",
    model="ollama/glm-5.1:cloud"
)
```

The spawned agent reads its SOUL file, works autonomously, and reports back to the orchestrator via Telegram. The orchestrator then spawns the next agent in the chain:

```
User → topic → Orchestrator → sessions_spawn → sw_architect
                                          ↓
User ← topic ← Orchestrator ← reply ←┘

(then planner spawns after architect, etc.)
```

For Dev phase, the chain is longer:

```
dev → writes code → tags verifier
verifier → tests code → tags reviewer
reviewer → reviews code → tags orchestrator
```

───

### 8. Project Workspace Structure

Every scaffolded project lives in `~/code/<project_name>/`:

```
<project_name>/
├── requirements/
│   └── requirements.txt    # Your input (what you asked for)
├── SRS.md                  # Software Requirements Specification
├── WORK_ORDERS.md          # Task list ( planner builds this)
├── ACCEPTANCE_CRITERIA.md  # Success criteria
├── SKILL.md               # Project skill set
├── TOOLS.md               # Available tools (sandbox, research tools)
├── MEMORY.md              # Persistent notes (build commands, quirks)
├── PROGRESS.md            # Handoff log between agents
├── SOUL_<key>.md          # One per agent (e.g., SOUL_dev.md)
└── [source code]         # Created during Dev phase
```

The workspace is the project agent's home directory. All agents spawned into the project use `cwd=/home/ubuntu/code/<project_name>`.

───

### 9. Context Recovery — How Agents Resume After Failure

Every agent (v4+) reads MEMORY.md and PROGRESS.md on startup. This is the recovery protocol:

1. **On spawn**, agent reads `MEMORY.md` (persistent notes) + `PROGRESS.md` (handoff log)
2. **Agent resumes** from where the previous agent left off
3. **Before finishing**, agent writes to PROGRESS.md (what it did, decisions, next steps)
4. **On timeout/failure**, orchestrator re-spawns the same agent with the same model
5. **The re-spawned agent** reads MEMORY + PROGRESS and picks up exactly where it stopped

This means no work is lost if an agent times out. The orchestrator never self-executes the agent's work — it always re-spawns.

---

## Architecture Overview

### File Locations

| Path | Purpose |
|------|---------|
| `~/.openclaw/openclaw.json` | Global config — agents, routing, models |
| `~/.openclaw/swfactory_scaffold.py` | Project provisioning tool |
| `~/.openclaw/sw_agent_catalog.yaml` | 8 agent templates (role + instructions) |
| `~/.openclaw/workspace/admin/` | Orchestrator context (SOUL, SKILL, AGENTS) |
| `~/code/<project_name>/` | Project workspace (SRS, code, docs) |
| `~/code/swfactory/` | Mirror of all factory files (record) |

### Agent Model Mapping

| Agent | Model | Purpose |
|-------|-------|---------|
| `sw_architect` | `ollama/glm-5.1:cloud` | Requirements, SRS, domain expertise |
| `sw_planner` | `ollama/minimax-m2.7:cloud` | Task breakdown, work orders, acceptance criteria |
| `dev` | `ollama/minimax-m2.7:cloud` | Coding, builds, testing |
| `verifier` | `ollama/minimax-m2.7:cloud` | QA, sandbox testing, test execution |
| `reviewer` | `ollama/glm-5.1:cloud` | Code review, security, refactoring |
| `uat` | `ollama/glm-5.1:cloud` | User acceptance testing, UI/UX verification |
| `debugger` | `ollama/glm-5.1:cloud` | Deep systemic bugs, UI/UX debugging |
| `docs` | `ollama/minimax-m2.7:cloud` | User guides, API docs |
| `marketer` | `ollama/glm-5.1:cloud` | Market research, launch strategy |

### Routing Model (v2)

All Telegram topic messages route to the **orchestrator** — never directly to agents:

```
User → Telegram topic → Orchestrator → sessions_spawn → Agent
                                                     ↓
User ← Telegram topic ← Orchestrator ← Agent result ←┘
```

This keeps the orchestrator in the loop for every message, enabling:
- Phase transitions without routing reconfiguration
- Multi-project support (different topics = different projects)
- The orchestrator can answer status questions at any time

---

## Agent Roles & Phases

### Planning Phase

| Agent | Role | What It Does |
|-------|------|--------------|
| `sw_architect` | Principal Software Architect | Reads requirements, performs web research, writes SRS.md with full feature specs, architecture decisions, and acceptance criteria |
| `sw_planner` | Project Planner | Reads SRS.md, creates detailed WORK_ORDERS.md and ACCEPTANCE_CRITERIA.md |

### Dev Phase

| Agent | Role | What It Does |
|-------|------|--------------|
| `dev` | Lead Developer | Picks topmost uncompleted work order, writes code, runs tests, tags @verifier |
| `verifier` | QA Verifier | Runs sandbox tests against acceptance criteria, loops with @dev until pass, tags @reviewer |
| `reviewer` | Senior Code Reviewer | Cross-checks against SRS.md, security review, approves or sends back to @dev |

### UAT Phase

| Agent | Role | What It Does |
|-------|------|--------------|
| `uat` | User Acceptance Tester | Runs end-to-end user flows, documents findings in UAT_REPORT.md, tags @debugger for bugs |
| `debugger` | Senior Debugging Specialist | Fixes deep systemic bugs, installs debugging tools, loops until resolved |

### Release Phase

| Agent | Role | What It Does |
|-------|------|--------------|
| `docs` | Technical Writer | Reads SRS.md + codebase, generates user guides and API docs in /docs/ |
| `marketer` | Product Marketer | Performs market research, reads SRS.md, drafts MARKETING_STRATEGY.md, blog posts, and social media |

---

## Research Tools

Agents with **SEARCH TOOL MANDATE** (`sw_architect`, `sw_planner`, `marketer`) must perform research. They use these tools in priority order:

| Priority | Tool | Description | When to Use |
|----------|------|-------------|-------------|
| 1 | `web_search` | Broad keyword search via Ollama | First choice for any research query. May return errors if provider is down. |
| 2 | `web_fetch` | Fetch and extract text from any URL | Great for reading specific pages, docs, APIs. Always available. |
| 3 | `browser` | Full Playwright web automation | Navigate, screenshot, fill forms, click elements. Use when the above aren't enough. |

**Fallback behavior:** If `web_search` returns an error (e.g., Ollama 404), agents automatically fall back to `web_fetch` for specific URLs or `browser` for full navigation. Agents never skip research.

---

## User Guide

### Starting a New Project

1. **Create a Telegram topic** (e.g., "MyApp Project")

2. **Mention the bot with your idea:**
   ```
   @jackoc1_bot let's build a web app for kids to color pictures
   ```

3. **The orchestrator responds:**
   - Confirms project name (e.g., `MyApp`)
   - Runs scaffold, restarts gateway, spawns `sw_architect`
   - SRS is generated in `~/code/MyApp/SRS.md`

4. **When SRS is ready**, you say:
   ```
   @jackoc1_bot let's move to Dev phase
   ```
   Or:
   ```
   @jackoc1_bot approve plan and start coding
   ```

5. **Orchestrator responds:**
   - Runs scaffold with `--update` for Dev agents
   - Spawns `dev` to begin coding
   - `dev` → `verifier` → `reviewer` → done

### Adding Features Mid-Project

If you want to add more agents or features after the fact:

```bash
# Add Dev agents to an existing project (Planning already done)
python3 /home/ubuntu/.openclaw/swfactory_scaffold.py MyApp 1077 none '["dev", "verifier", "reviewer"]' --update

# Or add UAT agents for testing
python3 /home/ubuntu/.openclaw/swfactory_scaffold.py MyApp 1077 none '["uat", "debugger"]' --update
```

The `--update` flag:
- Preserves `SRS.md`, `WORK_ORDERS.md`, existing code
- Only adds missing files
- Appends new work orders to existing list

### Brownfield Projects (Existing Code)

If you already have code but want to formalize it:

1. Create a topic with requirements (or use existing repo)
2. Mention bot: `@jackoc1_bot update this project to formal SRS`
3. Orchestrator detects `SRS.md` exists → treats as brownfield update
4. Reads existing SRS, adds new requirements, marks changes

### Troubleshooting Phase Stalls

If the pipeline stalls mid-task (common due to Ollama parallel job limit of 3):

1. The orchestrator will detect the stall after ~2 minutes
2. Reply with: `"restart"`
3. Orchestrator will:
   - Identify the frozen agent
   - Restart its environment
   - Resume from `WORK_ORDERS.md` latest step

### Tiered Sandbox

The scaffold auto-detects your project type and configures the appropriate sandbox:

| Project Type | Sandbox | Setup Command |
|---|---|---|
| Python | `venv` | `python3 -m venv .venv && source .venv/bin/activate` |
| Node.js | `node_modules` | `npm install` |
| Docker Compose | Docker | `docker compose up -d` |
| PHP | Built-in server | `php -S localhost:8899` |
| Static (HTML/JS/CSS) | None | No sandbox needed |

Sandbox commands are written to the project's `TOOLS.md` with setup, activate, teardown, and healthcheck instructions.
Agents read `TOOLS.md` and know how to use the sandbox for their phase.

---

---

## Troubleshooting

### "pairing required" Error

**Symptom:** `sessions_spawn` fails with:
```
gateway closed (1008): pairing required
```

**Cause:** Gateway device pairing is incomplete or expired.

**Fix:**
1. Check pending pairing: `openclaw devices list --json`
2. If you see a repair request, approve it:
   ```bash
   openclaw devices approve <request-id> --token <gateway-token>
   ```
3. If that fails, manually update `~/.openclaw/devices/paired.json` with full scopes
4. Restart gateway: `openclaw gateway restart`

### Scaffold Script Hangs / Gateway SIGTERM

**Symptom:** Running `swfactory_scaffold.py` causes silence. The orchestrator session dies.

**Cause:** The script used to call `openclaw gateway restart` internally, which kills the orchestrator session with SIGTERM.

**Fix (v2):** The scaffold script no longer restarts the gateway. The orchestrator handles the restart as a separate step after the script completes.

### Agent Not Responding

**Symptom:** Orchestrator mentions agent but no response.

**Fix:**
- Check session status: `ls /home/ubuntu/.openclaw/agents/orchestrator/sessions/`
- Look for session files with `topic:<topic_id>` suffix
- If stale, delete the session file and let orchestrator re-spawn

### web_search Returns 404

**Symptom:** Agent reports `web_search` error: `Ollama web search failed (404)`.

**Fix:** This is an Ollama Cloud endpoint issue. Agents automatically fall back to `web_fetch` (URL extraction) and `browser` (Playwright). No action needed.

### Web Research Not Working

**Symptom:** Agent skips research or says "search is unavailable."

**Fix:** Check that the agent's SOUL file has the `SEARCH TOOL MANDATE` directive and `TOOLS.md` documents the fallback chain (`web_search` → `web_fetch` → `browser`).

---

## Files and Their Purpose

| File | Role | When to Edit |
|------|------|--------------|
| `~/.openclaw/openclaw.json` | Global runtime config | Add new agents, change routing |
| `~/.openclaw/swfactory_scaffold.py` | Project provisioning tool | Add phases, change workspace layout |
| `~/.openclaw/sw_agent_catalog.yaml` | Agent templates | Add new agent roles, tweak instructions |
| `~/code/<project>/SKILL.md` | Project skill set | Add project-specific skills |
| `~/code/<project>/SOUL_<role>.md` | Agent role instructions | Customize agent behavior |
| `~/code/<project>/TOOLS.md` | Available tools | Document project-specific tools |
| `~/code/<project>/requirements.txt` | User requirements | Your input to the project |

---

## Quick Reference

### Core Commands

| Action | Command |
|--------|---------|
| Start Planning phase | `@jackoc1_bot plan project <name>` |
| Start Dev phase | `@jackoc1_bot start coding` or `@jackoc1_bot approve plan` |
| Add more agents | `python3 swfactory_scaffold.py <name> <topic> <repo\|none> '<agents>' --update` |
| Restart gateway | `openclaw gateway restart` |
| Check bindings | `openclaw agents bindings` |
| List agents | `openclaw agents list` |

### Phase JSON Arrays

- **Planning:** `["sw_architect", "sw_planner"]`
- **Dev:** `["dev", "verifier", "reviewer"]`
- **UAT:** `["uat", "debugger"]`
- **Release:** `["docs", "marketer"]`

### Agent Model Reference

- `glm-5.1:cloud` — Architect, Reviewer, UAT, Debugger, Marketer (reasoning-focused)
- `minimax-m2.7:cloud` — Planner, Dev, Verifier, Docs (general-purpose)
- Orchestrator also uses `minimax-m2.7:cloud`

### Research Tool Fallback

1. `web_search` → 2. `web_fetch` → 3. `browser`

---

## Getting Help

- **Documentation:** See `/home/ubuntu/.openclaw/workspace/admin/` for orchestrator SOUL, SKILL, AGENTS
- **Mirror repo:** `~/code/swfactory/` contains all factory files
- **Live config:** `~/.openclaw/openclaw.json` (real routing state)
- **Agent logs:** `/home/ubuntu/.openclaw/agents/orchestrator/sessions/`

---

*This README is the canonical reference for the OpenClaw SW Factory. For the latest config files, check `~/code/swfactory/`.*