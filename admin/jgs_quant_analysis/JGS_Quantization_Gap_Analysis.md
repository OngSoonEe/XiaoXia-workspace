# Intel JaguarShore (JGS) — Use-Case Recipe (UR) Validation & Quantization Gap Analysis

**Date:** 2026-05-03  
**Author:** OpenClaw Analysis (neutral third-party review)  
**Source Documents:**
- UR: Finetune Use-Case Recipe image (Team A)
- QR: Quantization Recipe for CRI/JGS Key Models v0.9.4 (Team B / INC)

---

## Part 1: UR Use-Case Inventory (from OCR + Visual Review)

The UR contains **8 finetune use-cases** for Intel JGS:

| # | Use-Case | Model | Priority | Owner | Framework/Lib |
|---|----------|-------|----------|-------|---------------|
| 1 | **Dense LLM SFT + Preference Optimization** | Dense 70B (Llama-3.1-70B, etc.), 32k context | P0 | Melanie | PyTorch, HF Transformers, PEFT, TRL, TorchAO (quant optional), vLLM (rollouts/inference), Triton (optional kernel accel) |
| 2 | **Flux.1 [Schnell] Image Generation** | Flux.1-schnell (12B Rectified Flow Transformer) | P1 | Kah Lun | PyTorch, HF Diffusers, PEFT (LoRA), Transformers (if text encoder tuned) |
| 3 | **Retrieval-Aware Finetuning (RAFT)** | Dense 30-70B (Llama-3.1-70B), 32k context | P1 | Joshua | PyTorch, LangChain/LlamaIndex, HF Transformers |
| 4 | **High-res VLM SFT (multi-image & short video)** | Llama 4 Maverick (MoE; ~17B active params) | P1 | Kah Lun | PyTorch, HF Transformers, PEFT, TRL, VLMEvalKit |
| 5 | **MoE Expert Expansion for Domains** | Llama 4 Maverick-style MoE | P1 | Joshua | PyTorch, HF Transformers (MoE support), MegaBlocks (MoE kernels), PEFT (optional) |
| 6 | **Agentic RL for Tool-Using Agents** | DeepSeek-V3 (MoE; 37B activated) | P2 | Melanie | PyTorch, vLLM, HF Transformers, TRL (GRPO/PPO), PEFT |
| 7 | **Large→Small Distillation** | Teacher: 70B → Student: 7-14B (Llama-4 → Falcon-Mamba-7B) | P3 | — | PyTorch, HF Transformers, Accelerate, TRL (preference KD) |
| 8 | **Execution-Grounded Code + Safety Alignment** | DeepSeek-Coder-V2 (Dense or MoE 30-70B), DeepSeek-R1 (Dense 70B) | P3 | — | PyTorch, vLLM, HF Transformers, TRL |

---

## Part 2: What is Intel JaguarShore (JGS)?

JaguarShore (JGS) is Intel's next-generation data center GPU, succeeding the Intel Data Center GPU Max series (Ponte Vecchio) and complementing the Gaudi AI Accelerator line. Per the QR document:

**Critical Architecture Difference:**

| Target | 8-bit Quantization | 4-bit Quantization | Native Model Dtype |
|--------|-------------------|-------------------|-------------------|
| **CRI** (Gaudi) | MXFP8 (E4M3, E8M0 scale, block 32) | **MXFP4** (E2M1, E8M0 scale, block 32) | BF16/FP16 |
| **JGS** (next-gen) | MXFP8 (E4M3, E8M0 scale, block 32) | **NVFP4** (E2M1, UE4M3 scale, block 16 + FP32 global scale) | BF16/FP16/FP8 |

**MXFP4 ≠ NVFP4.** MXFP4 is CRI/Gaudi-only. JGS uses NVFP4. This is the #1 issue to watch for.

---

## Part 3: UR Validation — Issues, Wrong, Missing, Overdone

### 3.1 Issues Found in UR

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | **No quantization method specified in UR** | **Critical** | The UR lists TorchAO "(quant optional)" for Use-Case 1 but doesn't specify WHICH quantization format (MXFP8? NVFP4? FP8?) for JGS. This is the biggest gap — without specifying JGS-native formats, the recipe is incomplete. |
| 2 | **DeepSeek-V3 (Use-Case 6) vs DeepSeek-R1 (Use-Case 8) — model confusion** | **Medium** | UR mentions DeepSeek-V3 for Agents and DeepSeek-R1 for Safety. The QR covers DeepSeek R1 quantization (MXFP8 + NVFP4), but DeepSeek-V3 is a different model (671B MoE, 37B active). QR has no recipe for DeepSeek-V3. |
| 3 | **Flux.1-schnell vs Flux.1-dev** | **Low** | UR says "Flux.1 [Schnell]" but QR's recipe is for "Flux.1-dev." Schnell is a distilled 4-step variant, dev is the full 50-step. Quantization behavior may differ. Should validate on the correct variant. |
| 4 | **No KV Cache / Attention quantization mentioned** | **High** | The QR v2 recipes include FP8 KV Cache + FP8 Attention quantization for LLMs. The UR doesn't mention this at all — critical for JGS memory/throughput. |
| 5 | **Llama 4 Maverick listed twice (UC4 + UC5)** | **Low** | Not a bug per se (different finetune tasks: VLM vs Domain MoE), but worth noting the same model appears in two use-cases with different quantization needs. |
| 6 | **Distillation (UC7) — Teacher is 70B, Student is 7-14B** | **Info** | Quantization on the Teacher side (70B) would accelerate distillation. Student (7-14B) may not need quantization since it's already small. UR doesn't address this. |
| 7 | **No mention of low-precision finetuning** | **Medium** | The QR Section 4 covers FP8/MXFP8 low-precision finetuning for Llama-3.1-8B and 70B. The UR doesn't specify whether any use-case intends to finetune in low precision (vs. quantize after BF16 finetuning). |

### 3.2 What's Wrong

| # | What's Wrong | Impact |
|---|-------------|--------|
| 1 | **"TorchAO (quant optional)" is vague** — doesn't specify JGS-native quant formats | Engineers can't implement; risk of using MXFP4 (CRI-only) on JGS |
| 2 | **DeepSeek-V3 (671B MoE) has no QR recipe** | Use-Case 6 (Agentic RL) can't be quantized without a new recipe |
| 3 | **No distinction between inference quantization vs. training quantization** | Different recipes apply: weight-only quant (inference) vs. hybrid E4M3 fwd/E5M2 bwd (training) |

### 3.3 What's Missing

| # | Missing Item | Affected Use-Cases |
|---|-------------|-------------------|
| 1 | **NVFP4 quantization recipe for JGS — not available for many models** | UC2 (Flux NVFP4 not started), UC4 (Llama4 Maverick NVFP4 WIP), UC5 (same), UC6 (DeepSeek-V3 no recipe), UC8 (DeepSeek-Coder-V2 no recipe) |
| 2 | **FP8 KV Cache + Attention quantization** | UC1, UC3, UC6, UC8 (all LLM use-cases) |
| 3 | **Low-precision finetuning recipes** beyond Llama 3.1 8B/70B | All use-cases except UC1 partially |
| 4 | **DeepSeek-V3 quantization recipe** | UC6 specifically |
| 5 | **Llama 4 Maverick NVFP4 recipe** (currently WIP) | UC4, UC5 |
| 6 | **Quantization for Distillation pipeline** (Teacher side) | UC7 |

### 3.4 What's Overdone / Unnecessary

| # | Item | Assessment |
|---|------|-----------|
| 1 | **Distillation Student quantization (7-14B)** | Not needed — the student model is already small enough for JGS without quantization |
| 2 | **RAFT (UC3) may not need quantization** | RAFT is about retrieval-aware training, not inference-heavy. If the model is 30B or smaller, quantization may be unnecessary. Only 70B RAFT would benefit. |
| 3 | **Flux.1-schnell quantization may be overkill** | Schnell is already a distilled 4-step model — very fast. Quantization gains are marginal vs. the accuracy risk. Only justified if batch throughput is the bottleneck. |

---

## Part 4: Quantization Needs per Use-Case

| # | Use-Case | Needs Quantization? | Rationale | Required Quantization |
|---|----------|--------------------|-----------|---------------------|
| 1 | Dense 70B SFT+PO | **Yes** | 70B model, memory-bound on JGS | MXFP8 (8-bit) or NVFP4 (4-bit) + FP8 KV/Attn |
| 2 | Flux.1 Image Gen | **Borderline** | 12B model; Schnell already fast; only if batch throughput is critical | MXFP8 if needed; NVFP4 if extreme compression needed |
| 3 | RAFT (Dense 30-70B) | **Partial** | Only 70B needs it; 30B may be fine without | MXFP8 for 70B variant; 30B can skip |
| 4 | VLM SFT (Llama4 Maverick) | **Yes** | MoE 17B active, but high memory for vision | FP8 (native model exists) or NVFP4 (WIP) |
| 5 | MoE Domain Expansion (Llama4 Maverick-style) | **Yes** | Same as UC4 | FP8 or NVFP4 (WIP) |
| 6 | Agentic RL (DeepSeek-V3, 37B active) | **Yes** | 37B active, MoE, high inference cost for rollouts | MXFP8 + NVFP4 (no recipe exists yet) |
| 7 | Distillation (70B→7-14B) | **Partial** | Teacher (70B) needs it; Student (7-14B) doesn't | Teacher: MXFP8 or NVFP4; Student: no quantization |
| 8 | Code + Safety (DeepSeek-Coder-V2, DeepSeek-R1) | **Yes** | 30-70B models, memory-bound | MXFP8 + NVFP4 (DeepSeek-R1 has recipe; Coder-V2 doesn't) |

---

## Part 5: Cross-Check with QR — Gap Identification

### 5.1 Use-Cases That Need Quantization AND Have Gaps in QR

| Use-Case | Required Quantization | QR Coverage | Gap |
|----------|----------------------|-------------|-----|
| **UC1: Dense 70B SFT+PO** | MXFP8 + NVFP4 + FP8 KV/Attn | MXFP8 ✓, NVFP4+ ✓, FP8 KV/Attn ✓ (Llama 3.1 70B) | **Gap: No low-precision finetuning recipe for NVFP4+** (only MXFP8 SFT validated in QR §4) |
| **UC2: Flux.1 Image Gen** | MXFP8 + NVFP4 | MXFP8 ✓, **NVFP4 Not started** | **Gap: NVFP4 recipe missing for JGS** |
| **UC4: VLM SFT (Llama4 Maverick)** | FP8 + NVFP4 | FP8 ✓ (native), **NVFP4 WIP** | **Gap: NVFP4 recipe not ready; FP8 KV/Attn not validated for Maverick** |
| **UC5: MoE Domain (Llama4 Maverick-style)** | FP8 + NVFP4 | Same as UC4 | **Gap: Same as UC4** |
| **UC6: Agentic RL (DeepSeek-V3)** | MXFP8 + NVFP4 + FP8 KV/Attn | **No recipe exists** | **Gap: DeepSeek-V3 is NOT DeepSeek-R1; completely missing recipe** |
| **UC8: Code + Safety (DeepSeek-Coder-V2)** | MXFP8 + NVFP4 | **No recipe exists** | **Gap: DeepSeek-Coder-V2 not covered in QR** |
| **UC8: Safety (DeepSeek-R1)** | MXFP8 + NVFP4 + FP8 KV/Attn | MXFP8 ✓, NVFP4 ✓, FP8 KV/Attn partial | **Gap: FP8 KV/Attn not explicitly validated for DeepSeek-R1 in QR** |

### 5.2 Use-Cases That Need Quantization BUT Are Covered

| Use-Case | Required Quantization | QR Coverage | Status |
|----------|----------------------|-------------|--------|
| **UC1: Dense 70B (Llama 3.1 70B)** | MXFP8 + NVFP4+ | Full coverage | ✓ OK (but finetuning recipe only MXFP8, not NVFP4+) |
| **UC8: Safety (DeepSeek-R1)** | MXFP8 + NVFP4 | Full coverage | ✓ OK (but KV/Attn needs explicit validation) |

### 5.3 Use-Cases Where Quantization Is NOT Needed or Overkill

| Use-Case | Assessment |
|----------|-----------|
| **UC7: Distillation Student (7-14B)** | No quantization needed — model already small |
| **UC3: RAFT with 30B model** | Likely not needed — 30B fits JGS without quantization |
| **UC2: Flux.1-schnell** | Borderline — already distilled, marginal gains from quantization |

---

## Part 6: Compiled Gap Report — Use-Cases Needing Quantization with Missing QR Coverage

### Use-Case 1: Dense 70B SFT + Preference Optimization

| Field | Value |
|-------|-------|
| **Model** | Llama-3.1-70B (Instruct), 32k context |
| **Finetune Method** | Stage-1: SFT (LoRA) → Stage-2: DPO or ORPO → Stage-3: GRPO with RLAIF-style rewards |
| **Quantization Needed** | MXFP8 (inference) or NVFP4+ (4-bit, higher compression) |
| **KV Cache / Attention** | FP8 KV Cache + FP8 Attention (critical for 32k context) |
| **QR Coverage** | MXFP8 ✓, NVFP4+ ✓, FP8 KV/Attn ✓ |
| **GAP** | ⚠️ Low-precision finetuning recipe only covers MXFP8 (not NVFP4+). If UC1 intends to finetune in NVFP4+ precision, this recipe is unvalidated. |
| **Recommendation** | Use MXFP8 finetuning (validated per QR §4.3). Post-finetuning, apply NVFP4+ quantization for inference deployment. |

---

### Use-Case 2: Flux.1 [Schnell] Image Generation

| Field | Value |
|-------|-------|
| **Model** | Flux.1-schnell (12B Rectified Flow Transformer) |
| **Finetune Method** | Prompt-based SFT for style control; LoRA/adapters for image generation; optional PO |
| **Quantization Needed** | MXFP8 (if needed); NVFP4 (if extreme compression needed) |
| **KV Cache / Attention** | N/A (diffusion model) |
| **QR Coverage** | MXFP8 ✓, **NVFP4 Not started** |
| **GAP** | ❌ **NVFP4 recipe missing for JGS** |
| **My View** | Flux.1-schnell is already distilled (4 steps). Quantization gains are marginal vs accuracy risk. MXFP8 is sufficient if quantization is truly needed. Skip NVFP4 unless batch throughput is the bottleneck. |

---

### Use-Case 4: High-res VLM SFT (Llama 4 Maverick)

| Field | Value |
|-------|-------|
| **Model** | Llama 4 Maverick (MoE; ~17B active params) |
| **Finetune Method** | Stage-1: projector + SFT on vision-text → Stage-2: GRPO for grounded multi-step reasoning |
| **Quantization Needed** | FP8 (native model available from Meta) or NVFP4 (4-bit, WIP) |
| **KV Cache / Attention** | FP8 KV Cache + Attention (not validated for Maverick in QR) |
| **QR Coverage** | FP8 ✓ (from Meta), **NVFP4 WIP**, KV/Attn not tested |
| **GAP** | ❌ **NVFP4 recipe not ready; FP8 KV/Attn not validated for Maverick** |
| **Recommendation** | Use native FP8 model for now. Wait for NVFP4 recipe completion. Validate FP8 KV/Attn on Maverick. |

---

### Use-Case 5: MoE Expert Expansion for Domains

| Field | Value |
|-------|-------|
| **Model** | Llama 4 Maverick-style MoE |
| **Finetune Method** | SFT on general + domain data; train router; add domain-specific experts |
| **Quantization Needed** | Same as UC4 (FP8 or NVFP4) |
| **QR Coverage** | Same gaps as UC4 |
| **GAP** | ❌ **Same as UC4** — NVFP4 WIP, FP8 KV/Attn unvalidated |
| **Additional Concern** | Expert expansion involves adding new experts — quantization during expert addition is unexplored territory. Router quantization may affect expert selection accuracy. |

---

### Use-Case 6: Agentic RL for Tool-Using Agents ⚠️ MAJOR GAP

| Field | Value |
|-------|-------|
| **Model** | DeepSeek-V3 (MoE; 671B total, 37B active) |
| **Finetune Method** | SFT on agent traces → Online Agentic RL (GRPO/PPO) with reward shaping |
| **Quantization Needed** | MXFP8 + NVFP4 + FP8 KV/Attn (critical for rollout inference speed) |
| **KV Cache / Attention** | FP8 KV Cache + Attention (essential — 37B active, multi-turn) |
| **QR Coverage** | ❌ **No recipe exists for DeepSeek-V3** |
| **GAP** | ❌ **BLOCKING — Completely missing from QR** |
| **My View** | DeepSeek-V3 (671B MoE) is NOT the same as DeepSeek-R1. The QR only covers DeepSeek-R1. DeepSeek-V3 has different architecture (larger MoE, different expert count). A new quantization recipe must be developed from scratch. This is the biggest gap in the entire analysis. |
| **Recommendation** | Either (a) switch model to DeepSeek-R1 (has QR recipe), or (b) create new DeepSeek-V3 quantization recipe (estimate: 4-6 weeks). |

---

### Use-Case 8: Execution-Grounded Code + Safety Alignment

| Field | Value |
|-------|-------|
| **Model** | DeepSeek-Coder-V2 (Dense or MoE 30-70B) + DeepSeek-R1 (Dense 70B) |
| **Finetune Method** | SFT on diffs/tests → Execution-based RL (PPO/GRPO) + RLAIF/RLHF with multi-objective GRPO |
| **Quantization Needed** | MXFP8 + NVFP4 + FP8 KV/Attn |
| **QR Coverage** | DeepSeek-R1: MXFP8 ✓, NVFP4 ✓; **DeepSeek-Coder-V2: No recipe** |
| **GAP** | ⚠️ **DeepSeek-Coder-V2 recipe missing** |
| **My View** | If using DeepSeek-R1 (which has QR coverage), the gap is smaller. DeepSeek-Coder-V2 is a separate model and needs its own recipe. If the use-case can be served by DeepSeek-R1, this gap is avoidable. |
| **Recommendation** | Prioritize DeepSeek-R1 for this use-case (has QR recipe). If Coder-V2 is required, develop new quantization recipe (estimate: 2-3 weeks). |

---

## Part 7: Summary & Priority Action Items

### Gap Severity Ranking

| Priority | Use-Case | Gap | Severity | ETA to Fix |
|----------|----------|-----|----------|------------|
| **P0** | UC6: Agentic RL (DeepSeek-V3) | No quantization recipe at all | **BLOCKING** | 4-6 weeks |
| **P1** | UC4/5: VLM + MoE Domain (Llama4 Maverick) | NVFP4 WIP; FP8 KV/Attn unvalidated | **High** | 2-3 weeks |
| **P1** | UC8: Code + Safety (DeepSeek-Coder-V2) | No quantization recipe | **High** | 2-3 weeks |
| **P2** | UC2: Flux.1 (NVFP4) | NVFP4 recipe not started | **Medium** | 3-4 weeks (but may not be needed) |
| **P2** | UC1: Dense 70B (NVFP4+ finetuning) | Low-precision finetuning only for MXFP8 | **Medium** | 1-2 weeks |
| **P2** | UC8: DeepSeek-R1 FP8 KV/Attn | Not explicitly validated | **Low** | 1 week |

### Architecture Reminder

| | CRI (Gaudi) | JGS (Next-Gen) |
|---|------------|---------------|
| **8-bit** | MXFP8 (E8M0, block 32) | MXFP8 (E8M0, block 32) |
| **4-bit** | **MXFP4** (E8M0, block 32) | **NVFP4** (UE4M3, block 16 + FP32 global) |
| **FP8** | N/A | FP8 (E4M3/E5M2, per-tensor) |

### Recommendations

1. **UC6 (DeepSeek-V3):** Switch to DeepSeek-R1 if possible, or start recipe development now — this is the biggest blocker.
2. **UC4/5 (Llama4 Maverick):** Use native FP8 model for now; track NVFP4 WIP completion.
3. **UC8 (DeepSeek-Coder-V2):** Use DeepSeek-R1 variant if possible; otherwise start recipe development.
4. **UC2 (Flux):** MXFP8 is sufficient; NVFP4 is overkill for Schnell (already distilled).
5. **All LLM use-cases:** Add FP8 KV Cache + FP8 Attention quantization spec — critical for 32k context and multi-turn agents.
6. **UR update:** Replace "TorchAO (quant optional)" with explicit JGS-native quantization format specifications (MXFP8, NVFP4, FP8 KV/Attn).