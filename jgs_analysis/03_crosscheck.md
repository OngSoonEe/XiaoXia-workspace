# Step 3: Cross-check UR ↔ QR — Gap Analysis

## Methodology

For each UR use-case where quantization is needed, I checked:
1. Is the **base model** covered by QR?
2. Is there a **JGS-specific** recipe (not just CRI)?
3. Are the **quantization methods** in QR appropriate for the use-case?
4. Are there **deployment scenarios** in UR that QR doesn't address (e.g., long context, agentic rollouts, MoE-new-experts, SSM)?

## Detailed gap matrix

### Use-case #1 — SFT LoRA → DPO → GRPO (Llama-3.1-70B)

| Aspect | QR Coverage | Status |
|--------|------------|--------|
| Llama-3.1-70B NVFP4 recipe | Table 8, Table 10 | ✅ Ready |
| Llama-3.1-70B NVFP4+ recipe | Table 9 | ✅ Ready |
| Llama-3.1-70B MXFP8 recipe | Table 7 | ✅ Ready |
| 32k-64k context KV cache | Table 13 (Llama-3.3-70B) — FP8 KV Cache | ✅ Ready |
| FP8 Attention | Table 4 (Llama-3.1-8B), Table 11 (Llama-3.3-70B) | ✅ Ready |
| GRPO reward model | None | ⚠️ Gap |
| LoRA → merged → quant path | Implicit, not explicit | ⚠️ Minor gap |

**Verdict**: Mostly covered. Reward model quant recipe missing.

---

### Use-case #2 — Flux.1 Schnell (12B Rectified Flow Transformer)

| Aspect | QR Coverage | Status |
|--------|------------|--------|
| Flux FP8 recipe | Table 34 | ✅ (CRI / Generic) |
| Flux MXFP8 recipe | Table 35 | ✅ (CRI / Generic) |
| JGS-specific Flux recipe | Table 3: "Not started yet" | ❌ **Gap** |
| Flux.1-schnell vs Flux.1-dev distinction | Not differentiated | ⚠️ Minor gap |
| Text encoder (T5) quant | Table 35 notes "T5 MXFP8" (v0.8.1) | ⚠️ Partial — JGS-side unclear |

**Verdict**: JGS-specific Flux recipe is **explicitly missing** per QR's own overall status table.

---

### Use-case #3 — RAFT + RAG-native (Llama-3.1-70B)

| Aspect | QR Coverage | Status |
|--------|------------|--------|
| Llama-3.1-70B NVFP4/MXFP8 | Same as #1 | ✅ Ready |
| 32k context KV cache | ✅ | ✅ Ready |
| RAG embedding model quant | **None** | ❌ **Gap** |
| Reranker model quant | **None** | ❌ **Gap** |
| Document encoder quant | **None** | ❌ **Gap** |

**Verdict**: LLM backbone covered, but **RAG pipeline components** (embedding/reranker) have no quant recipes.

---

### Use-case #4 — High-res VLM SFT (Llama 4 Maverick MoE 17B active)

| Aspect | QR Coverage | Status |
|--------|------------|--------|
| Llama4 Maverick FP8 (official Meta) | Table 26 | ✅ Ready |
| Llama4 Maverick NVFP4 (JGS) | Table 27 | ⚠️ **WIP per Table 3** |
| Vision tower quant | Listed in exclude layers | ⚠️ Partial |
| Multi-image / video handling | Not addressed in recipe | ⚠️ Gap |

**Verdict**: FP8 official is ready; **NVFP4 JGS-specific is WIP**.

---

### Use-case #5 — MoE Expert Expansion for Domains (Llama 4 Maverick-style MoE)

| Aspect | QR Coverage | Status |
|--------|------------|--------|
| Base Llama4 Maverick NVFP4 | WIP | ⚠️ Already gap |
| Custom expert quant | **None** | ❌ **Major gap** |
| Router weight quant | Listed in exclude layers | ⚠️ Partial |
| Per-expert calibration data | Not addressed | ❌ Gap |
| Hot-swappable experts at inference | Not addressed | ❌ Gap |

**Verdict**: Adding new experts is a **structural change** to the MoE. Existing Maverick recipe was calibrated for the original 128E. **No recipe exists for "MoE + new experts" quant path.**

---

### Use-case #6 — Agentic RL for Tool-Using Agents (DeepSeek-V3 37B activated)

| Aspect | QR Coverage | Status |
|--------|------------|--------|
| DeepSeek-V3 recipe | **None — only R1** | ❌ **Major gap** |
| DeepSeek-R1 NVFP4 recipe | Table 21 | ✅ (proxy only) |
| DeepSeek-R1 MXFP4 recipe | Table 20 | ✅ (proxy only) |
| DeepSeek-R1 MXFP8 recipe | Table 19 | ✅ (proxy only) |
| Tool-calling vLLM rollouts | Not addressed | ⚠️ Gap |
| Long-horizon trajectory memory | Not addressed | ⚠️ Gap |

**Verdict**: **DeepSeek-V3 ≠ DeepSeek-R1**. R1 is reasoning-dense with fewer routing patterns. V3 is the general model with more diverse routing. **Quant recipe for V3 is missing.**

---

### Use-case #7 — Large→Small Distillation → Falcon-Mamba-7B

| Aspect | QR Coverage | Status |
|--------|------------|--------|
| Falcon-Mamba recipe | **None** | ❌ **Major gap** |
| Any Mamba/SSM recipe | **None** | ❌ **Major gap** |
| Cross-arch KD quant | **None** | ❌ **Major gap** |
| 7B class Mamba model quant | **None** | ❌ **Major gap** |

**Verdict**: **Entirely uncovered.** QR only covers Transformer (Llama/DeepSeek/Qwen families) and a few multimodal models. Mamba SSM architecture is a quant blind spot.

---

### Use-case #8 — Execution-Grounded Code Model (DeepSeek-Coder-V2)

| Aspect | QR Coverage | Status |
|--------|------------|--------|
| DeepSeek-Coder-V2 recipe | **None** | ❌ **Major gap** |
| DeepSeek-R1 (proxy) | Tables 14, 15, 16, 19-21 | ⚠️ Partial |
| Sandbox runner outputs quant | Not addressed | ⚠️ Gap |
| Long-context code (whole repo) | Not addressed | ⚠️ Gap |

**Verdict**: **DeepSeek-Coder-V2 recipe missing.** Only DeepSeek-R1 recipes exist, and the architectures differ enough that the proxy may not transfer cleanly.

---

### Use-case #9 — Safety & Policy Alignment (DeepSeek-R1 Dense 70B)

| Aspect | QR Coverage | Status |
|--------|------------|--------|
| DeepSeek-R1 MXFP8 recipe | Table 19 | ✅ Ready |
| DeepSeek-R1 NVFP4 recipe | Table 21 | ✅ Ready |
| DeepSeek-R1 MXFP4 recipe | Table 20 | ✅ Ready |
| Reward model quant | **None** | ❌ **Gap** |
| RLAIF/RLHF reward model class | **None** | ❌ **Gap** |
| Multi-objective GRPO | Implicit only | ⚠️ Minor gap |

**Verdict**: Base model fully covered. **Reward model and policy model quant paths are missing.**

---

## Major gaps synthesized (cross-use-case)

1. **No DeepSeek-V3 recipe** — affects #6
2. **No DeepSeek-Coder-V2 recipe** — affects #8
3. **No Mamba / SSM recipe at all** — affects #7
4. **No RAG pipeline component recipes** (embedding, reranker, doc encoder) — affects #3
5. **No MoE-with-new-experts quant recipe** — affects #5
6. **No reward model / policy model quant recipes** — affects #1, #6, #9
7. **JGS-specific Flux recipe not started** — affects #2
8. **JGS-specific Llama4 Maverick NVFP4 still WIP** — affects #4, #5
9. **No long-context (128k+) recipes** — affects anything with RULER-like long-input requirements
10. **No tool-calling / agentic rollout quant recipes** — affects #6
11. **No video / multi-modal quant recipes** — affects #4

## Minor observations on QR itself

- QR is well-maintained (v0.9.7) and has accuracy tables
- QR lacks a "use-case → recipe" mapping document — recipes are organized by model, not by deployment scenario
- QR's "Other model recipes" section (Section 3) is for models that aren't JGS-priority; this signals that QR's scope is **inference recipes for key models**, not finetuning recipes
- QR Section 4 (Low Precision Finetuning) explicitly covers Llama-3.1-8B and Llama-3.1-70B — only these two models have **training-time quant recipes**