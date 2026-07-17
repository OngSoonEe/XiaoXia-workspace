# SW Factory — Improvement Roadmap

## 1. Current Scale Limitations

### What Works Now
- Topic-based project isolation for small/parallel projects
- Phase delegation model is clean conceptually
- Brownfield support via `--update` flag

### What Breaks at Medium/Big Scale

#### No Task Parallelism Within a Phase
Dev works one WO at a time sequentially. In a medium project (50+ WOs), this is painfully slow. A real dev team would have multiple devs working different WOs in parallel.

#### No State Persistence Between Agent Runs
Agents are `mode: "run"` (one-shot). They wake up, read files, do work, die. No long-running context. For a big project, an agent can't build up deep codebase understanding over time — it re-reads everything each spawn.

#### 3-Job Ollama Limit is a Hard Ceiling
Even if you could parallelize agents, the infra caps at 3 concurrent calls. Medium projects need more throughput.

#### No CI/CD Integration
No automated testing pipeline, no deployment story. For anything beyond a toy app, you need CI.

#### Agent Quality Depends on LLM Quality
Current models (glm-5.1, minimax-m2.7) are mid-tier. Complex architectural decisions or tricky bugs may exceed their capability. A human senior dev would catch things these models miss.

#### No Code Review Governance
Reviewer says "approved" and that's it. No approval gates, no required reviewers, no rollback mechanism.

#### No Dependency Management Between WOs
If WO3 depends on WO1, there's no formal dependency graph. The dev just reads WORK_ORDERS.md and figures it out. Works for 9 WOs, breaks at 50.

#### UAT is Still Shallow
Even with browser testing, the UAT agent runs prescribed flows. It won't discover the weird edge cases a real human tester finds by clicking around randomly.

### Honest Assessment

This system is great for **small projects** (1-2 week scope, <15 WOs, solo or pair-sized). Medium projects (1-3 months, multi-module) would stretch it badly. Big projects (team of 5+, 6+ months) — don't even try.

### Areas to Improve for Medium Scale
1. Task dependency graph in WORK_ORDERS.md (DAG, not flat list)
2. Parallel dev agents (multiple WOs concurrently, respecting dependencies)
3. Persistent agent sessions (not one-shot) for deep codebase familiarity
4. CI/CD integration (at minimum: auto-run verifier on each dev commit)
5. Human approval gates between phases (not just agent-to-agent handoff)

---

## 2. Tiered Sandboxing

### What Sandboxing Solves
- Verifier/dev running untrusted code (npm install, pip install) without trashing the host
- UAT testing against a clean environment (not a polluted one where dev left artifacts)
- Reproducibility — same sandbox = same test results

### What Sandboxing Does NOT Solve
- It won't make agents smarter
- It won't fix the parallelism or state problems above
- It adds complexity and startup time

### Tiered Sandbox by Project Type

| Project Type | Sandbox | Why |
|---|---|---|
| Python app | `venv` | Zero-cost, instant, isolates dependencies perfectly |
| Node.js app | `nvm` + local `node_modules` | Same — instant, lightweight |
| PHP/HTML static | None needed | Just serve from dir, nothing to isolate |
| Full-stack (DB+API+UI) | Docker Compose | Need isolated DB, API server, etc. |
| Microservices | Docker Compose | Multiple services need isolation |

### Sandbox Definitions

```yaml
sandbox:
  python:
    create: "python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    activate: "source .venv/bin/activate"
    teardown: "rm -rf .venv"

  node:
    create: "nvm use && npm install"
    teardown: "rm -rf node_modules"

  docker:
    create: "docker compose up -d"
    teardown: "docker compose down -v"
    healthcheck: "docker compose ps"
```

### Detection Logic
The scaffold detects project type from `requirements/` content (Python imports? Node packages? Dockerfile?) and sets up the right sandbox. Agents read TOOLS.md and know how to use it.

### What NOT to Do
- Full VM-style sandboxing (firecracker, gVisor) — overkill, slow startup, complex
- Sandboxing the agents themselves (limiting their tool access) — they need tools to work
- Docker for everything — adds 5-10s startup per test cycle, painful for fast iteration on simple projects

### Bottom Line
Sandboxing is useful for robustness but only when matched to project complexity. `venv` for Python, Docker for full-stack, nothing for static. The key is **detecting project type and choosing the right sandbox automatically** — not forcing Docker on everything.