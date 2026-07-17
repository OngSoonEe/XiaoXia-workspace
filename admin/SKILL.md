# Factory Management Skill

## scaffold_project

`scaffold_project(project_name, topic_id, repo_url, json_agent_keys, update=False)` provisions a project workspace and wires the agent team in `openclaw.json`.

`repo_url` is optional. Use `none` when no git repository is attached.

**topic_id** is the Telegram thread ID from message metadata (for example `581`).

**update** flag (optional): If True, preserves existing project files (SRS.md, WORK_ORDERS.md, etc.) and only adds missing agents. Use for brownfield updates or phase transitions where agents should pick up where they left off.

**Implementation:**
```bash
python3 /home/ubuntu/.openclaw/swfactory_scaffold.py create {project_name} {topic_id} {repo_url} '{json_agent_keys}'
# Or with update flag:
python3 /home/ubuntu/.openclaw/swfactory_scaffold.py create {project_name} {topic_id} {repo_url} '{json_agent_keys}' --update
```

**Cleanup:**
To remove stale bindings and agent state (run from orchestrator):
```bash
python3 /home/ubuntu/.openclaw/swfactory_scaffold.py cleanup
openclaw gateway restart
```

Or from any session, just run:
```bash
python3 /home/ubuntu/.openclaw/swfactory_scaffold.py cleanup

**Phase Playbooks:**

| Phase | json_agent_keys | Agent Roles |
|-------|-----------------|-------------|
| Planning | `["sw_architect", "sw_planner"]` | Architect creates SRS, Planner creates WORK_ORDERS & ACCEPTANCE_CRITERIA |
| Dev | `["dev", "verifier", "reviewer"]` | Dev writes code, Verifier tests, Reviewer approves |
| UAT | `["uat", "debugger"]` | UAT runs end-to-end tests, Debugger fixes deep bugs |
| Release | `["docs", "marketer"]` | Docs writes user guides, Marketer drafts launch materials |

**What the script does:**
1. Creates `/home/ubuntu/code/{project_name}/` workspace (no separate .openclaw subdir)
2. Creates `requirements/`, `docs/`, `marketing/` subdirs if missing
3. Writes `SKILL.md`, `TOOLS.md`, `MEMORY.md`, `SOUL_{role}.md` context files
4. Routes topic to `orchestrator` in `openclaw.json` (no agent entries needed — agents are spawned via `sessions_spawn`)
5. Does NOT restart gateway — you must run `openclaw gateway restart` separately after the script completes

**IMPORTANT:** The scaffold script does NOT restart the gateway because the restart would kill the orchestrator's own session. After running the scaffold, the orchestrator must call `openclaw gateway restart` as a separate step.

**Routing Model:**
- ALL messages in a project topic go to orchestrator
- Orchestrator delegates to phase agents via `sessions_spawn`
- All agents persist across phase transitions (no agent removal)

**Git policy:** No automatic commit/push. Git operations happen only when user explicitly requests them.

**Fallback:**
```bash
python3 /home/ubuntu/.openclaw/swfactory_scaffold.py {project_name} {topic_id} {repo_url} '{json_agent_keys}'
openclaw gateway restart
```

Note: The gateway restart MUST be run separately because it kills the orchestrator session. The scaffold script does not restart it automatically.

## Success Checks

1. `/home/ubuntu/code/{project_name}/` exists
2. `SOUL_*.md` files exist in workspace for all phase agents
3. `openclaw.json` `bindings` contains a route for topic `{topic_id}` to `orchestrator`
4. For Planning phase only: `SRS.md` exists before marking done

## Cleanup

Over time, `openclaw.json` accumulates stale topic bindings when projects are abandoned.
These are harmless (agents won't spawn into non-existent workspaces) but you can clean manually:

**Check current bindings:**
```bash
python3 -c "import json; d=json.load(open('/home/ubuntu/.openclaw/openclaw.json')); print(json.dumps(d.get('bindings',[]), indent=2))"
```

**Remove specific binding:**
```bash
python3 -c "
import json
with open('/home/ubuntu/.openclaw/openclaw.json') as f:
    d = json.load(f)
d['bindings'] = [b for b in d['bindings'] if b.get('match',{}).get('peer',{}).get('id') != '-1003926859444:topic:1114']
with open('/home/ubuntu/.openclaw/openclaw.json','w') as f:
    json.dump(d, f, indent=2)
print('Removed topic 1114 binding')
"
```

**Remove all topic bindings for non-existent projects:**
```bash
python3 -c "
import json, os
with open('/home/ubuntu/.openclaw/openclaw.json') as f:
    d = json.load(f)
workspaces = [d for d in os.listdir('/home/ubuntu/code') if os.path.isdir(os.path.join('/home/ubuntu/code', d))]
# (Complex mapping logic would go here — for now, manual review is safer)
print('Manual cleanup recommended — bindings don\'t auto-map to project names')
"
```

Use `--update` flag when:
- Adding new phase agents to existing project (e.g., Planning → Dev)
- Project already has SRS.md and needs new agents
- You want to preserve existing files while adding agents

Example:
```bash
# Add dev agents to existing App_nini2 project
python3 /home/ubuntu/.openclaw/swfactory_scaffold.py App_nini2 1077 none '["dev", "verifier", "reviewer"]' --update
```

## Delegation Protocol (Orchestrator)

After `scaffold_project` completes, spawn a sub-session for the first agent. **Always pass the agent's model** from the catalog.

**IMPORTANT:** Use `mode: "run"` (one-shot) without `agentId`. The Telegram plugin does not support `mode: "session"` with `agentId`. Instead, embed role instructions in the task prompt by referencing the SOUL file:

```python
sessions_spawn(
    task="You are the {role} for {project_name}. Read SOUL_{key}.md, SKILL.md, and TOOLS.md in your workspace, then follow the instructions in SOUL_{key}.md exactly. Begin your work immediately.",
    runtime="subagent",
    mode="run",
    cwd=f"/home/ubuntu/code/{project_name}",
    model="<model from catalog>"
)
```

Agent model mapping:
| Agent Key | Model |
|-----------|-------|
| sw_architect | ollama/glm-5.1:cloud |
| sw_planner | ollama/minimax-m2.7:cloud |
| dev | ollama/minimax-m2.7:cloud |
| verifier | ollama/minimax-m2.7:cloud |
| reviewer | ollama/glm-5.1:cloud |
| uat | ollama/glm-5.1:cloud |
| debugger | ollama/glm-5.1:cloud |
| docs | ollama/minimax-m2.7:cloud |
| marketer | ollama/glm-5.1:cloud |

Example:
```python
sessions_spawn(
    task="You are the Software Architect for App_nini2. Read SOUL_sw_architect.md, SKILL.md, and TOOLS.md in your workspace, then follow the instructions in SOUL_sw_architect.md exactly. Begin your work immediately.",
    runtime="subagent",
    mode="run",
    cwd="/home/ubuntu/code/App_nini2",
    model="ollama/glm-5.1:cloud"
)
```
