# Step 4: Compiled Gap Report — UR Use-cases Needing Quantization with QR Gaps

> Scope: Use-cases where quantization is genuinely needed (per Step 2) AND QR coverage has gaps (per Step 3).

---

## Summary

Of the 9 UR use-cases:
- **3 are clean** (covered by QR): #1, #3 (LLM backbone only), #9 (base model only)
- **6 have gaps** that need to be flagged:
  1. **#2 — Flux.1 Schnell** (JGS-specific recipe not started)
  2. **#4 — VLM SFT (Llama4 Maverick)** (JGS NVFP4 still WIP)
  3. **#5 — MoE Expert Expansion** (no recipe for MoE-with-new-experts)
  4. **#6 — Agentic RL (DeepSeek-V3)** (no V3 recipe, only R1 proxy)
  5. **#7 — Distillation → Falcon-Mamba-7B** (no SSM/Mamba recipe at all)
  6. **#8 — Code Model (DeepSeek-Coder-V2)** (no V2 recipe)

Plus **cross-cutting gaps** that affect multiple use-cases:
- RAG pipeline components (embedding/reranker) — affects #3
- Reward model quant — affects #1, #6, #9
- Long-context (128k+) recipes — affects #1, #3, #9
- Video / multi-modal quant — affects #4

---

## Gap Details

### GAP-1: Flux.1 Schnell on JGS (Use-case #2)

- **UR use-case**: Flux.1 [Schnell] Image Generation (P0)
- **Quant needed**: MXFP8 (weight + activation), FP8 KV cache if interactive
- **QR coverage**:
  - ✅ Flux FP8 recipe exists (Table 34, CRI)
  - ✅ Flux MXFP8 recipe exists (Table 35, CRI)
  - ❌ **JGS-specific Flux recipe: "Not started yet" per QR Table 3**
- **Gap details**:
  - CRI and JGS have different scale formats (E8M0 vs UE4M3)
  - CRI flux recipe uses MXFP8 with E8M0 scale — this may not directly apply to JGS
  - JGS may want NVFP4 instead of MXFP8 for Flux (since NVFP4 is JGS's preferred 4-bit format)
  - T5 text encoder quant is mentioned (Flux T5 MXFP8) but JGS-side status unclear
- **Severity**: **High** — P0 use-case, no JGS path

---

### GAP-2: Llama 4 Maverick NVFP4 on JGS (Use-cases #4, #5)

- **UR use-cases**:
  - #4 High-res VLM SFT (P1)
  - #5 MoE Expert Expansion (P1)
- **Quant needed**: NVFP4 (Llama4 Maverick is one of the showcase models for JGS NVFP4)
- **QR coverage**:
  - ✅ FP8 official (Table 26)
  - ⚠️ NVFP4 (Table 27) — exists but **WIP per Table 3**
- **Gap details**:
  - NVFP4 for Maverick is work-in-progress, accuracy results not yet finalized
  - Accuracy table (Table 28) only shows FP8 vs NVFP4 — but recipe itself is WIP
  - For use-case #5 (new experts), even if WIP completes, the recipe needs re-validation
- **Severity**: **High** — affects 2 use-cases

---

### GAP-3: MoE with New Experts (Use-case #5)

- **UR use-case**: MoE Expert Expansion for Domains (P1)
- **Quant needed**: Same as Maverick NVFP4, plus handling of new expert weights
- **QR coverage**: ❌ **None for "MoE + new experts"**
- **Gap details**:
  - Existing recipes are calibrated for **frozen** MoE weights
  - Adding new domain experts requires new calibration data
  - Router weights are typically excluded (per Maverick FP8 recipe) — but new router for new experts may need different treatment
  - Hot-swappable experts at inference (a likely deployment pattern for domain routing) has no recipe
- **Severity**: **High** — structural quant gap

---

### GAP-4: DeepSeek-V3 (Use-case #6)

- **UR use-case**: Agentic RL for Tool-Using Agents (P2)
- **Quant needed**: NVFP4 or MXFP8 (37B activated MoE)
- **QR coverage**:
  - ✅ DeepSeek-R1 NVFP4 recipe (Table 21) — proxy only
  - ✅ DeepSeek-R1 MXFP8 recipe (Table 19) — proxy only
  - ✅ DeepSeek-R1 MXFP4 recipe (Table 20) — proxy only
  - ❌ **No DeepSeek-V3 specific recipe**
- **Gap details**:
  - V3 and R1 share base architecture but differ in:
    - Training data mix (V3 is general, R1 is reasoning-heavy)
    - Routing patterns (more diverse in V3)
    - Activation distribution per expert
  - Quant calibration data for V3 would differ from R1
  - Tool-calling vLLM rollouts may hit edge cases not present in R1's typical workload
- **Severity**: **High** — proxy recipe is risky for P2 use-case

---

### GAP-5: Falcon-Mamba-7B / SSM Quantization (Use-case #7)

- **UR use-case**: Large→Small Distillation for deploy (P3)
- **Quant needed**: 7B SSM model for deployment
- **QR coverage**: ❌ **No SSM/Mamba recipe exists in QR**
- **Gap details**:
  - QR only covers Transformer (Llama/DeepSeek/Qwen) and a few multimodal models
  - Mamba SSM has:
    - Selective state-space scans (not GEMM)
    - Conv1d operations
    - Different memory access patterns
  - Quant benefit for SSM is **structurally different** from Transformer:
    - State matrix quantization may have different sensitivity than attention matrices
    - SSM is more memory-bound than compute-bound → weight quant helps, activation quant less so
  - Cross-arch KD (Llama4 Transformer → Mamba SSM) is rare — student quant recipe is even rarer
- **Severity**: **Critical** — entire model class missing from QR

---

### GAP-6: DeepSeek-Coder-V2 (Use-case #8)

- **UR use-case**: Execution-Grounded Code Model (P3)
- **Quant needed**: MXFP8 or NVFP4 for 30-70B code model
- **QR coverage**:
  - ❌ **No DeepSeek-Coder-V2 recipe**
  - ⚠️ DeepSeek-R1 is the only MoE proxy
- **Gap details**:
  - Coder-V2 has different tokenizer + vocabulary from R1
  - Code data has different token distribution than reasoning text
  - Calibration data for quant should be code samples, not general text
  - Long-context code (whole-repo) handling may need attention/KV cache work not yet done
- **Severity**: **High** — model is P3 but architecture differs from R1

---

### CROSS-CUTTING GAP-A: Reward Model Quantization

- **Affected UR use-cases**: #1 (GRPO), #6 (Agentic RL), #9 (RLAIF/RLHF)
- **Quant needed**: Reward models are typically 7-13B (e.g., Skywork, InternLM2-Reward)
- **QR coverage**: ❌ **None** — QR doesn't list any reward model
- **Gap details**:
  - Reward models need low-latency inference (called many times per training step)
  - 7B reward model is small enough that BF16 might suffice — but if JGS has unified quant infra, MXFP8 is the natural fit
  - No recipe for "reward model class" of models
- **Severity**: **Medium** — affects 3 use-cases but each can choose BF16 fallback

---

### CROSS-CUTTING GAP-B: RAG Pipeline Components

- **Affected UR use-case**: #3 (RAFT + RAG-native)
- **Quant needed**:
  - Embedding model (e.g., BGE, E5) for retrieval
  - Reranker model (e.g., BGE-reranker, Cohere) for re-ranking
  - Document encoder if separate from embedding
- **QR coverage**: ❌ **None** — QR only covers generative models
- **Gap details**:
  - RAG latency dominated by retrieval, not generation
  - Embedding/reranker quant is its own field (typically INT8 for embeddings)
  - No recipe in QR for non-generative models
- **Severity**: **Medium** — RAG perf depends on these but they're typically smaller

---

### CROSS-CUTTING GAP-C: Long-Context (128k+) Recipes

- **Affected UR use-cases**: #1 (32k-64k), #3 (32k), #9 (potentially 128k for safety eval)
- **Quant needed**: KV cache + attention quant at long context
- **QR coverage**:
  - ✅ FP8 KV cache recipe (v0.5.2, v0.9.0)
  - ✅ FP8 Attention recipe
  - ⚠️ RULER results in QR only go up to 128k for Qwen-235B (Table 23)
  - ❌ **No recipe explicitly validated at 128k+ context length**
- **Gap details**:
  - QR's RULER test shows MXFP8 Qwen-235B drops from 0.9990 to 0.5020 at 128k (Table 23)
  - That's nearly 50% accuracy loss at long context — **a critical issue for RAG/safety use-cases**
  - NVFP4+ recipe for Llama-3.1-70B (Table 9) has no long-context test results
- **Severity**: **High** — long-context quant is a known weak point

---

### CROSS-CUTTING GAP-D: Video / Multi-modal Quant

- **Affected UR use-case**: #4 (High-res VLM, multi-image and short video)
- **Quant needed**: Vision tower quant, video frame encoder quant
- **QR coverage**:
  - ✅ Wan2.2 (T2V/I2V/S2V) recipes (Section 3.4-3.6)
  - ✅ FramePack recipes (Section 2.12)
  - ✅ Flux vision/text encoder handling in exclude layers
  - ⚠️ No recipe for vision tower quant inside a VLM (only for standalone video/image models)
- **Gap details**:
  - Maverick's vision_model is in the exclude list (Table 26, 27) — meaning it's NOT quantized
  - For high-res multi-image scenarios, vision tower is significant memory consumer
  - No recipe for "quantize the vision encoder" within a VLM
- **Severity**: **Medium** — vision tower is typically small relative to LLM

---

## Final use-case list for the gap report

The following UR use-cases have **quantization needs AND gaps in QR**:

| # | UR Recipe | Owner | Primary Gap |
|---|-----------|-------|-------------|
| 2 | Flux.1 Schnell Image Gen | Kah Lun | JGS Flux recipe not started |
| 4 | High-res VLM SFT | Kah Lun | Llama4 Maverick NVFP4 JGS still WIP |
| 5 | MoE Expert Expansion | Joshua | No "MoE + new experts" quant recipe |
| 6 | Agentic RL (DS-V3) | Melanie | No DeepSeek-V3 recipe (R1 only) |
| 7 | Distill to Falcon-Mamba-7B | — | No SSM/Mamba recipe at all |
| 8 | Code Model (DS-Coder-V2) | — | No DeepSeek-Coder-V2 recipe |

Plus cross-cutting gaps that compound the issues:
- **Reward model quant** — affects #1, #6, #9
- **RAG component quant** — affects #3
- **Long-context quant validation** — affects #1, #3, #9
- **Vision tower quant in VLM** — affects #4