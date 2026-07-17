# SW Factory Memory

## Current State (2026-05-03)

### Factory System
- **Repo**: https://github.com/ewizt/SwFactory-OpenClaw.git
### Tags
- **v1-basic-working**: Initial working scaffold
- **v2-uat-enhanced**: UAT + debugger agents
- **v3-sandbox**: Tiered sandbox, conservative cleanup, --update preservation
- **v4-context-recovery**: DAG work orders, MEMORY+PROGRESS context recovery, Playwright UAT (latest: `9b7bb4c`)
- **Mirror local**: `/home/ubuntu/code/swfactory/`
- **Scaffold script**: `/home/ubuntu/.openclaw/swfactory_scaffold.py` (subcommands: `create`, `cleanup`)
- **Agent catalog**: `/home/ubuntu/.openclaw/sw_agent_catalog.yaml` (9 agent templates)
- **Orchestrator workspace**: `/home/ubuntu/.openclaw/workspace/admin/`

### Model Mapping
| Agent | Model |
|-------|-------|
| sw_architect | ollama/glm-5.1:cloud |
| sw_planner | ollama/minimax-m2.7:cloud |
| dev | ollama/minimax-m2.7:cloud |
| verifier | ollama/minimax-m2.7:cloud |
| reviewer | ollama/glm-5.1:cloud |
| uat | ollama/glm-5.1:cloud |
| debugger | ollama/glm-5.1:cloud |
| docs | ollama/minimax-m2.7:cloud |
| marketer | ollama/glm-5.1:cloud |
| orchestrator | ollama/minimax-m2.7:cloud |

### Key Architecture Decisions
- All topic messages route to orchestrator only (no direct topic-to-agent bindings)
- Agents spawned via `sessions_spawn(mode="run")` without `agentId`
- Task prompts embed role instructions referencing SOUL files in project workspace
- Scaffold does NOT restart gateway (SIGTERMs orchestrator) — orchestrator handles restart separately
- `--update` flag preserves existing SOUL files, TOOLS.md (only refreshes sandbox section), SRS.md, WORK_ORDERS.md
- Only orchestrator needs registered agent entry in `openclaw.json`
- UAT: does both exploratory browser testing AND Playwright test specs (`.spec.js`)
- Debugger: general-purpose debugger, re-runs Playwright specs after fixing bugs
- UAT saves screenshots to `/uat_snapshots/`, debugger to `/debug_snapshots/`
- Browser tool globally available via `alsoAllow` in `openclaw.json`
- Headless Chromium at `/home/ubuntu/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`

### v4 Context Recovery System
- All 9 agents have CONTEXT RECOVERY preamble (read MEMORY.md + PROGRESS.md on spawn)
- Agents write PROGRESS.md entry before finishing (role, what done, key decisions, next steps)
- Agents write learnings to MEMORY.md (build commands, quirks, gotchas)
- PROGRESS.md: created by scaffold, preserved on --update
- MEMORY.md: created by scaffold, preserved on --update
- PROGRESS.md format: chronological handoff log
- MEMORY.md format: persistent notes (like CLAUDE.md auto-memory)

### v4 DAG Work Orders
- Planner adds `depends_on` field when project has >5 WOs
- Simple flat format for ≤5 WOs (no depends_on field)
- Dev agent checks depends_on prerequisites before starting a WO
- Only direct prerequisites listed (no transitive)
- WORK_ORDERS.md template includes HTML comment format guide

### v4 UAT Enhanced with Playwright
- UAT now does BOTH exploratory browser testing AND automated Playwright test specs
- Creates `/uat/specs/*.spec.js` with per-acceptance-criterion tests
- Includes Playwright spec template in agent instructions
- Runs `npx playwright test` and captures HTML report
- Non-UI projects get `/uat/scripts/*.sh` shell tests instead
- Debugger updated to re-run Playwright specs after bug fixes
- UAT_REPORT.md references specific spec files for each criterion

### v3 Sandbox System
- Scaffold auto-detects project type: python/venv, node/npm, docker/compose, php, static, unknown
- If required tool missing, TOOLS.md includes Install command for agents to run first
  - python3-venv: `sudo apt install python3-venv`
  - npm: nodesource LTS install script
  - docker: `get.docker.com`
  - php: `sudo apt install php-cli`
- Planner validates/confirms sandbox type during Planning phase (SANDBOX VALIDATION step)
- TOOLS.md marks sandbox as "auto-detected by scaffold, planner validates"

### Cleanup (Conservative)
- `cleanup` subcommand removes stale topic bindings only when confirmed stale
- Does NOT use session files for liveness (they're ephemeral)
- Scans `~/code/` for scaffolded projects (SKILL.md presence) as context
- When in doubt, keeps bindings (safer default)

### Active Projects
- **App_nini2**: Topic 1264, workspace `/home/ubuntu/code/App_nini2/`
  - Completed: Planning + Dev phases (SRS.md, WORK_ORDERS.md, code all exist)
  - Upgraded with: UAT + Debugger SOULs (latest versions)
  - Snapshot dirs: `uat_snapshots/`, `debug_snapshots/`
  - Project type: static (HTML/JS/CSS coloring book)

### Daily News Pipelines
- **Workspace**: `~/topics/news` (git repo → https://github.com/ewizt/project_DailyNews.git)
- **AI & Tech** (08:00 SGT): `scripts/daily-news-cron.sh` → 5 AI + 3 Tech + 1 Local → soonee.ong@gmail.com + siaw.chen.lee@intel.com
- **General News** (08:30 SGT): `scripts/daily-general-news.sh` → 5 Global + 3 Asia + 2 Malaysia → soonee.ong@gmail.com only
- See `memory/2026-05-05.md` for full details

### Telegram
- Group ID: `-1003926859444`
- Admin topic: 1077 (Sw Factory)
- App_nini2 topic: 1264

### Binding in openclaw.json
- `orchestrator` bound to specific topics only (1077, 1264)
- `main` is first in `agents.list` → default fallback for new topics
- New topics route to `main` (not orchestrator) until explicitly bound
- bind_topic.py at `~/.openclaw/bind_topic.py` (synced from swfactory)

### Ollama Cloud
- 3 parallel job limit — Dev phase (dev+verifier+reviewer) can hit deadlock
- Intervention: tag frozen agent, ask to restart and resume from WORK_ORDERS.md

### Pairing
- Fixed manually by editing `/home/ubuntu/.openclaw/devices/paired.json` with full scopes
- CLI `openclaw devices approve` also fails with "pairing required" chicken-and-egg

### Known Issues
- Gateway restart SIGTERMs orchestrator session (expected, ~10-20s blackout)
- `web_search` returns 404 from Ollama provider
- Scaffold `requirements/` check fails if scaffold creates the empty dir before checking contents (pre-existing bug, not critical)

### Integrity Verification (2026-05-03)
- No legacy model refs (kimi/qwen) in any file
- No legacy paths (workspace/projects/) in any file
- Bindings correct: 1077, 1264, catch-all → orchestrator
- No ghost agent entries in openclaw.json
- Catalog: 9 agents, 2 models, all have CONTEXT RECOVERY preamble
- All 9 agents have MEMORY.md + PROGRESS.md read/write instructions
- UAT has Playwright test spec instructions + exploratory testing
- Debugger has Playwright re-run reference
- Planner has DAG depends_on logic (conditional on >5 WOs)
- Dev has depends_on prerequisite checking
- Scaffold syntax clean
- PROGRESS.md created on new, preserved on --update
- WORK_ORDERS.md template includes format guide
- App_nini2: intact (not re-scaffolded, no PROGRESS.md yet)