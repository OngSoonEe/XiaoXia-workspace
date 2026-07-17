# Intel JaguarShore (JGS) — Tri-Document Re-Analysis Report

**Date:** 2026-05-05  
**Author:** OpenClaw AI Specialist  
**Documents Analyzed:**
- **UR** (User Requirements): 8 Finetune Use-Case Recipes for Intel JGS (Team A)
- **QR** (Quantization Recipe): v0.9.7 for CRI/JGS Key Models (Team B / INC)
- **Cross-Check**: Gap identification for Team B enablement

**Research References:**
- AutoRound GitHub: https://github.com/intel/auto-round
- AutoRound MXFP4/NVFP4 Accuracy: https://github.com/intel/auto-round/blob/main/docs/mxnv_acc.md
- AutoRound Diffusion Quantization: https://github.com/intel/auto-round/blob/main/auto_round/compressors/diffusion/README.md
- AutoRound VLM Quantization: https://github.com/intel/auto-round/blob/main/auto_round/compressors/mllm/README.md
- SignRound V1 Paper: https://arxiv.org/abs/2309.05516 (EMNLP 2024)
- SignRound V2 Paper: https://arxiv.org/abs/2512.04746 (Dec 2025)
- vLLM Quantization Docs: https://docs.vllm.ai/en/latest/features/quantization/
- HuggingFace Transformers Quantization: https://huggingface.co/docs/transformers/main/en/quantization/overview

---

## PART 0: Hardware Context — JGS vs CRI

This is the foundational knowledge that underpins the entire analysis.

| Aspect | CRI (Gaudi) | JGS (JaguarShore) |
|--------|------------|-------------------|
| **8-bit format** | MXFP8 (E4M3, E8M0 scale, block 32) | MXFP8 (E4M3, E8M0 scale, block 32) |
| **4-bit format** | **MXFP4** (E2M1, E8M0 scale, block 32) | **NVFP4** (E2M1, UE4M3 scale, block 16, FP32 global scale) |
| **NVFP4+** | Not available | E2M1, FP8 E5M3 scale, block 16, no global scale |
| **Native dtypes** | BF16, FP16 | BF16, FP16, **FP8** |
| **vRAM (D variant)** | ~96GB | **160GB** |
| **Quant algo** | AutoRound for MXFP4 | AutoRound for NVFP4 (Intel recipe), RTN as fallback |

**Key insight from QR revision history (v0.8.2, Dec 2025): "Re-prioritize NVFP4 for JGS"**
→ NVFP4 was originally CRI-oriented but was re-prioritized as the primary JGS 4-bit format in Dec 2025. The QR now explicitly maps:
- **CRI → MXFP4** (their 4-bit path)
- **JGS → NVFP4** (their 4-bit path)

**JGS supports FP8 natively**, which CRI does not. This means JGS can run native FP8 models (like Llama 4 Maverick from Meta) without additional quantization.

---

## PART 1: DOC 1 — UR Recipe Correctness & Improvement Review

### 1.1 UR Use-Case Inventory (8 Finetune Recipes)

| UC# | Use-Case | Model | Priority | Framework/Lib |
|-----|----------|-------|----------|---------------|
| UC1 | Dense LLM SFT + Preference Optimization | Llama-3.1-70B, 32K ctx | P0 | PyTorch, HF Transformers, PEFT, TRL, TorchAO (quant optional), vLLM |
| UC2 | Flux.1 [Schnell] Image Generation | Flux.1-schnell (12B Rectified Flow Transformer) | P1 | PyTorch, HF Diffusers, PEFT (LoRA) |
| UC3 | Retrieval-Aware Finetuning (RAFT) | Dense 30-70B (Llama-3.1-70B), 32K ctx | P1 | PyTorch, LangChain/LlamaIndex, HF Transformers |
| UC4 | High-res VLM SFT (multi-image & short video) | Llama 4 Maverick (MoE; ~17B active params) | P1 | PyTorch, HF Transformers, PEFT, TRL, VLMEvalKit |
| UC5 | MoE Expert Expansion for Domains | Llama 4 Maverick-style MoE | P1 | PyTorch, HF Transformers (MoE support), MegaBlocks, PEFT |
| UC6 | Agentic RL for Tool-Using Agents | DeepSeek-V3 (MoE; 37B activated) | P2 | PyTorch, vLLM, HF Transformers, TRL (GRPO/PPO), PEFT |
| UC7 | Large→Small Distillation | Teacher: 70B → Student: 7-14B (Llama-4 → Falcon-Mamba-7B) | P3 | PyTorch, HF Transformers, Accelerate, TRL |
| UC8 | Execution-Grounded Code + Safety Alignment | DeepSeek-Coder-V2 (~236B MoE) + DeepSeek-R1 (70B Dense) | P3 | PyTorch, vLLM, HF Transformers, TRL |

### 1.2 Overall UR Assessment

**What's Good:**
- Use-cases are well-scoped with clear models and frameworks
- Priority levels (P0-P3) are reasonable
- Multi-stage training pipelines (SFT → DPO/ORPO → GRPO) follow current best practices
- RLHF/GRPO/RLAIF methodology is state-of-the-art

**What's Wrong / Needs Improvement:**

#### 🔴 Critical Issues

| # | Issue | Affected UCs | Why It Matters |
|---|-------|-------------|----------------|
| 1 | **"TorchAO (quant optional)" is dangerously vague** | UC1 | TorchAO supports many quantization schemes. Without specifying JGS-native formats (MXFP8 for 8-bit, NVFP4 for 4-bit), engineers could accidentally use MXFP4 (CRI-only) or INT4 (suboptimal for JGS hardware). This is a one-way door — wrong quant format = non-functional pipeline. |
| 2 | **No quantization format specified for any UC** | All | Every use-case that needs quantization leaves format undefined. The QR document explicitly recommends NVFP4 for JGS 4-bit and MXFP8 for 8-bit. The UR must reference these. |
| 3 | **DeepSeek-V3 ≠ DeepSeek-R1 — model confusion** | UC6 | UC6 uses DeepSeek-V3 (671B MoE, 37B active). The QR ONLY covers DeepSeek-R1 (dense 70B). These are completely different architectures with different quantization profiles. DeepSeek-V3 has NO quantization recipe. |

#### 🟡 High-Impact Issues

| # | Issue | Affected UCs | Recommendation |
|---|-------|-------------|----------------|
| 4 | **No FP8 KV Cache / FP8 Attention quantization specified** | UC1, UC3, UC6, UC8 | The QR's v2 recipes (Mar 2026) include FP8 KV Cache + FP8 Attention. For 32K context and multi-turn agents, this is critical — KV cache can consume 50%+ of inference memory. Must be added to all LLM use-cases. |
| 5 | **No distinction between CRI and JGS data type support** | All | UR doesn't acknowledge that JGS uses NVFP4 (not MXFP4). Engineers referencing CRI docs would apply wrong recipes. |
| 6 | **No low-precision finetuning consideration** | UC1, UC6 | The QR ($4) validates MXFP8 and MXFP4 SFT finetuning for Llama 3.1 8B/70B. The UR doesn't specify whether finetuning happens in BF16 (then quantize for inference) or directly in low precision. This is a significant performance/accuracy decision. |
| 7 | **MoE model deployment strategy undefined** | UC4, UC5, UC6 | MoE models (Llama 4 Maverick 400B total, DeepSeek-V3 671B total) have only 17-37B active params. But whether ALL experts are loaded into vRAM or offloaded determines quantization need drastically. Not specified. |

#### 🟢 Lower-Impact / Refinement Issues

| # | Issue | Affected UCs | Notes |
|---|-------|-------------|-------|
| 8 | **Flux.1-schnell vs Flux.1-dev confusion** | UC2 | UR says "Flux.1 [Schnell]" but QR recipe is validated on Flux.1-dev. Schnell is a distilled 4-step variant — quantization behavior may differ. Validate on the correct variant. |
| 9 | **Distillation Teacher quantization undefined** | UC7 | Teacher (70B) inference drives the entire distillation pipeline speed. Quantizing the teacher with MXFP8 would accelerate distillation 2x without meaningfully affecting student quality. Not specified. |
| 10 | **No batching or latency SLA targets** | All | Without throughput/latency targets, it's impossible to determine whether quantization is necessary or just nice-to-have. |
| 11 | **Llama 4 Maverick appears twice (UC4 + UC5)** | UC4, UC5 | Different tasks (VLM vs domain MoE) but same model. If UC4 quantizes the model one way and UC5 a different way, conflicts arise. Need unified quantization strategy. |
| 12 | **Falcon-Mamba-7B (Student in UC7) — Mamba architecture** | UC7 | Mamba (SSM) models have different quantization characteristics than Transformer models. The QR has no Mamba/SSM recipes. If student needs quantization, this is a new architecture to support. |

### 1.3 Non-Quantization Improvements for UR

1. **Add hardware target column**: `Target: JGS-D (160GB, NVFP4/MXFP8)` vs `Target: CRI (96GB, MXFP4/MXFP8)`
2. **Add memory budget per UC**: "VRAM budget: 140GB for model + 20GB for KV cache + activations"
3. **Add quantization format column**: Mirroring QR's data type recommendation table
4. **Specify training precision**: BF16 training → MXFP8/NVFP4 inference, or MXFP8 training → NVFP4 inference
5. **Add KV cache quantization requirement**: "FP8 KV Cache + FP8 Attention (per QR v2 recipe)" for all LLM UCs
6. **Specify MoE loading strategy**: "All experts loaded (X GB)" or "Expert offloading (Y GB active)"
7. **Add AutoRound reference**: As the primary Intel quantization algorithm (SignRound V1/V2)
8. **Define success criteria**: Accuracy tolerance (e.g., "≤1% benchmark degradation at NVFP4")

---

## PART 2: DOC 2 — Which UR Recipes Genuinely Require Quantization?

### 2.1 VRAM Constraint Analysis

**JGS-D has 160GB vRAM.** Let's calculate memory requirements:

| Model | Architecture | Params | FP16/BF16 VRAM | VRAM Budget | Fits Without Quant? |
|-------|-------------|--------|-----------------|-------------|---------------------|
| Llama-3.1-70B | Dense Transformer | 70B | ~140GB | 160GB | Barely — no room for KV cache, activations, or batching |
| Flux.1-schnell | Rectified Flow Transformer | 12B | ~24GB | 160GB | Easily |
| Llama-3.1-30B (RAFT) | Dense Transformer | 30B | ~60GB | 160GB | Easily |
| Llama 4 Maverick | MoE Transformer | 400B total, 17B active | ~34GB (active) / ~800GB (all experts) | 160GB | Active-only: yes. All experts: NO |
| DeepSeek-V3 | MoE Transformer | 671B total, 37B active | ~74GB (active) / ~1.3TB (all experts) | 160GB | Active-only: tight. All experts: NO |
| Teacher 70B (UC7) | Dense Transformer | 70B | ~140GB | 160GB | Barely |
| Falcon-Mamba-7B (UC7 Student) | Mamba SSM | 7B | ~14GB | 160GB | Easily |
| DeepSeek-R1 | Dense Transformer | 70B | ~140GB | 160GB | Barely |
| DeepSeek-Coder-V2 | MoE Transformer | 236B total, 21B active | ~472GB (all) / ~42GB (active) | 160GB | Active-only: yes. All experts: NO |

### 2.2 Quantization Requirement Assessment

| UC# | Model | **Genuinely Requires Quant?** | Severity | Rationale |
|-----|-------|------------------------------|----------|-----------|
| UC1 | Llama-3.1-70B | ✅ **YES** | **CRITICAL** | 140GB leaves only 20GB for KV cache (32K context), activations, and framework overhead. At 32K context with batching, KV cache alone can exceed 40GB. Quantization to MXFP8 (8-bit) reduces model to ~70GB, leaving 90GB headroom. NVFP4 (4-bit) would reduce to ~35GB. **Without quantization, 32K context + batching is impossible on JGS-D.** |
| UC2 | Flux.1-schnell (12B) | ❌ **NOT REQUIRED** | LOW | 24GB fits easily in 160GB. Schnell is already a distilled 4-step model — quantization gains are marginal. Only needed if batch throughput for image gen is the primary bottleneck (e.g., serving 100+ images/min). |
| UC3 | Dense 30-70B | ⚠️ **PARTIAL** | MEDIUM | 30B fits easily (60GB). 70B needs quantization for the same reasons as UC1. Since UC3 targets both, the 70B variant requires MXFP8/NVFP4. |
| UC4 | Llama 4 Maverick (MoE) | ⚠️ **DEPENDS ON LOADING STRATEGY** | HIGH | If all 400B experts loaded: MUST quantize (800GB FP16 won't fit). If only active experts (17B): FP16 fits (~34GB). Meta provides a native FP8 Maverick model — using FP8 native would reduce to ~200GB for all experts or ~17GB for active-only. **Recommendation: Use native FP8 model for now; NVFP4 when ready.** |
| UC5 | Llama 4 Maverick-style MoE | ⚠️ **SAME AS UC4** | HIGH | Same architecture, same considerations. Additional concern: UC5 adds NEW experts — quantization during/after expert expansion is unexplored territory. Router quantization may affect expert selection accuracy. |
| UC6 | DeepSeek-V3 (671B MoE) | ✅ **YES — MOST CRITICAL** | **BLOCKING** | 37B active × FP16 = 74GB. BUT this is an Agentic RL use-case with vLLM rollouts — inference speed drives RL throughput. Even if the model fits, (a) multi-turn agent traces create large KV caches, (b) GRPO/PPO runs many parallel rollouts, (c) all experts may need loading for diverse tool-use patterns. **MXFP8 (37GB active / 335GB all experts) may still be too large for all-experts. NVFP4 is likely REQUIRED for full expert loading.** |
| UC7 | Teacher 70B → Student 7-14B | ⚠️ **PARTIAL** | LOW-MEDIUM | Teacher (70B) benefits from quantization for faster distillation (same 140GB constraint as UC1). Student (7-14B) easily fits without quantization. Distillation doesn't need KV cache. |
| UC8 | DS-Coder-V2 + DS-R1 | ✅ **YES** | **HIGH** | DeepSeek-R1 (70B): Same as UC1 — quantization required. DeepSeek-Coder-V2: 236B MoE with 21B active — all experts at FP16 = 472GB won't fit. Even MXFP8 all-experts = 236GB won't fit. **NVFP4 all-experts (118GB) is the only way to load full Coder-V2 on JGS-D.** |

### 2.3 Summary: Quantization Priority Matrix

| Priority | UC# | Model | Required Quantization | Why |
|----------|-----|-------|----------------------|-----|
| **P0** | UC6 | DeepSeek-V3 | NVFP4 (must have) or MXFP8 (minimum) | 671B MoE; Agentic RL with multi-turn rollouts; no QR recipe at all |
| **P1** | UC1 | Llama-3.1-70B | MXFP8 (minimum), NVFP4+ (optimal) | 140GB FP16 leaves no headroom for 32K context KV cache |
| **P1** | UC8 | DS-Coder-V2 | NVFP4 (must have for full model) | 236B MoE; only NVFP4 fits all experts in 160GB |
| **P1** | UC8 | DeepSeek-R1 | MXFP8 + NVFP4 | Same 70B constraint as UC1 |
| **P2** | UC4/UC5 | Llama 4 Maverick | Native FP8 (now), NVFP4 (when ready) | Native FP8 fits; NVFP4 WIP in QR |
| **P3** | UC3 | 70B variant | MXFP8 | Same as UC1 but less latency-sensitive |
| **P4** | UC7 | Teacher 70B | MXFP8 (nice to have) | Distillation throughput boost; not strictly required |
| — | UC2 | Flux.1-schnell | NOT REQUIRED | 12B fits easily; Schnell already fast (4 steps) |
| — | UC7 | Student 7-14B | NOT REQUIRED | Small models; easily fit |

---

## PART 3: DOC 3 — Cross-Check with QR: Gap Analysis

### 3.1 QR Coverage Inventory (v0.9.7, April 2026)

From the extracted QR tables:

**CRI Key Models (Table 2):**
| Model | MXFP8 | MXFP4 |
|-------|-------|-------|
| Llama 3.3 70B | ✓ | ✓ |
| Qwen3-30B-A3B | ✓ | Not required |
| Llama4 Scout | Not required | ✓ |
| Flux | ✓ | Not required |
| DeepSeek-R1 | ✓ | ✓ |
| Llama 3.1 8B | ✓ | ✓ (AutoRound mixed, avg 7.55 bits) |
| GPT-OSS-120B | Not required (native) | Not required (native) |
| Qwen-235B | ✓ | ✓ |
| WAN 2.2 T2V-14B | ✓ | Not required |
| Wan2.2 I2V-14B-720P | ✓ | Not required |
| WAN 2.2 S2V-14B | ✓ | Not required |
| FramePack | ✓ | Not required |

**JGS Key Models (Table 3):**
| Model | MXFP8 | NVFP4 |
|-------|-------|-------|
| Llama 3.1 70B | ✓ | ✓ (+ NVFP4+) |
| DeepSeek-R1 | ✓ | ✓ |
| Llama4 Maverick | Not required (native FP8) | **WIP** |
| Flux | ✓ | **Not started** |
| DLRM | WIP | WIP |

**Additional QR Sections:**
- **Section 4.2**: Low-precision finetuning — MXFP8 SFT and MXFP4 SFT validated for Llama 3.1 8B/70B
- **V2 recipes** (Mar 2026): FP8 KV Cache + FP8 Attention for Llama3, DeepSeek-R1, Qwen-235B
- **Wan2.2 video models** (Apr 2026): FP8 + MXFP8 for T2V, I2V, S2V

### 3.2 Gap Matrix: UR × QR

| UC# | Model | Quant Needs | QR Coverage | Gap Status | Details |
|-----|-------|------------|-------------|------------|---------|
| **UC1** | Llama-3.1-70B | MXFP8, NVFP4+ | ✅ All covered | 🟢 **LOW GAP** | MXFP8 ✓, NVFP4 ✓, NVFP4+ ✓, FP8 KV/Attn ✓. Only gap: low-precision finetuning only validates MXFP8 (not NVFP4+). If UC1 wants NVFP4+ finetuning, this is unvalidated. |
| **UC2** | Flux.1-schnell | N/A (not required) | MXFP8 ✓, NVFP4 ✗ | 🟢 **NO GAP (optional)** | MXFP8 exists. NVFP4 not started but not needed for Schnell. Schnell is distilled 4-step — quantization benefits marginal. |
| **UC3** | Dense 30-70B | MXFP8 (70B only) | ✅ Covered if Llama 3.1 | 🟢 **LOW GAP** | If using Llama-3.1-70B for RAFT, recipe exists. If using a different 70B architecture, new recipe needed. 30B variant doesn't need quantization. |
| **UC4** | Llama 4 Maverick | Native FP8 → NVFP4 | FP8 ✓, NVFP4 WIP | 🟡 **MEDIUM GAP** | Native FP8 Maverick works today (Meta provides it). NVFP4 recipe is WIP — not blocking but limits optimization. FP8 KV/Attn not validated for Maverick in QR. |
| **UC5** | Llama 4 Maverick-style MoE | FP8 → NVFP4 | Same as UC4 | 🟡 **MEDIUM GAP** | Same as UC4. Additional risk: expert expansion + quantization interaction unexplored. Router quantization fidelity unknown. |
| **UC6** | DeepSeek-V3 (671B MoE) | MXFP8 + NVFP4 | ❌ **NOTHING** | 🔴 **BLOCKING GAP** | DeepSeek-V3 is NOT DeepSeek-R1. The QR covers DeepSeek-R1 (dense 70B) extensively but DeepSeek-V3 (671B MoE, 37B active) has ZERO coverage. This is the single largest gap in the entire analysis. Different architecture, different expert count, different quantization profile. A new recipe must be created from scratch. |
| **UC7** | Teacher 70B | MXFP8 (optional) | ✅ Covered if Llama 3.1 | 🟢 **LOW GAP** | If teacher is Llama-3.1-70B, recipe exists. Falcon-Mamba-7B student: no Mamba quantization in QR but student doesn't need quantization. |
| **UC8** | DeepSeek-R1 (70B) | MXFP8 + NVFP4 | ✅ Fully covered | 🟢 **LOW GAP** | Both MXFP8 and NVFP4 recipes exist. FP8 KV/Attn in v2 recipe. |
| **UC8** | DeepSeek-Coder-V2 (~236B MoE) | NVFP4 | ❌ **NOTHING** | 🔴 **HIGH GAP** | 236B MoE, 21B active. Completely different from DeepSeek-R1. No recipe exists. Only NVFP4 can fit all experts in 160GB. |

### 3.3 Gap Details & Team B Enablement Required

#### 🔴 BLOCKING: UC6 — DeepSeek-V3 (Agentic RL)

**Problem:** DeepSeek-V3 has NO quantization recipe in QR. The QR covers DeepSeek-R1 (dense 70B) but not DeepSeek-V3 (671B MoE).

**Why V3 ≠ R1:**
- DeepSeek-R1: 70B dense Transformer, 16 attention heads, standard FFN
- DeepSeek-V3: 671B MoE (256 experts, top-8 routing), 37B active, Multi-Head Latent Attention (MLA), DeepSeekMoE architecture
- MLA changes quantization dynamics significantly (compressed KV representation)
- MoE routing gate sensitivity to quantization is unknown

**AutoRound context:** AutoRound v0.8.8 (Feb 2026) updated DS/QWEN results using v2 recipe (FP8 KV/Attn) — but this was for DeepSeek-R1, not V3. The AutoRound GitHub mentions "DeepSeek-R1 int2-mixed" model (200GB, 97.9% accuracy) but no DeepSeek-V3 quantized models.

**What Team B must do:**
1. Profile DeepSeek-V3 architecture differences vs R1
2. Develop MXFP8 recipe (RTN, block 32, E8M0 scale) — estimate 2-3 weeks
3. Develop NVFP4 recipe (AutoRound, block 16, UE4M3 scale + FP32 global) — estimate 3-4 weeks
4. Validate accuracy on Agentic RL benchmarks (BFCL, ToolBench, τ-Bench)
5. Develop FP8 KV/Attn recipe for MLA architecture — estimate 1-2 weeks
6. Validate on vLLM with tool-calling workloads

**Mitigation options:**
- **Option A (fastest):** Switch UC6 to DeepSeek-R1 (has full QR coverage). Dense 70B at NVFP4 fits comfortably. Trade-off: R1 is less capable at tool-use than V3.
- **Option B (medium):** Use Qwen-235B (MoE, has MXFP8 + NVFP4 + MXFP4 QR coverage). Trade-off: different model family.
- **Option C (full):** Develop DeepSeek-V3 recipes from scratch. Estimate: 4-6 weeks.

#### 🔴 HIGH: UC8 — DeepSeek-Coder-V2

**Problem:** 236B MoE with 21B active. All experts at FP16 = 472GB — won't fit JGS-D (160GB). Even MXFP8 all-experts = 236GB — still won't fit. Only NVFP4 (118GB) fits all experts with KV cache headroom.

**What Team B must do:**
1. Create NVFP4 recipe for DeepSeek-Coder-V2 MoE architecture — estimate 3-4 weeks
2. Validate on code benchmarks (HumanEval, MBPP, SWE-bench)
3. Validate on safety benchmarks (HarmBench, AdvBench)

**Mitigation:** If only active experts (21B) are loaded, FP16 fits (42GB). But code tasks benefit from full expert access for diverse programming languages.

#### 🟡 MEDIUM: UC4/UC5 — Llama 4 Maverick NVFP4

**Problem:** NVFP4 recipe is WIP. Native FP8 model works today.

**What Team B must do:**
1. Complete NVFP4 recipe development — QR shows WIP status
2. Validate FP8 KV/Attn for Maverick's architecture
3. Test quantization with vision encoder (multimodal quantization is less mature)
4. AutoRound VLM support is experimental — needs validation on Maverick specifically

**Note:** AutoRound's VLM quantization only supports 5 model families. Llama 4 Maverick is not among them. This means the VLM quantization path needs significant development.

#### 🟢 LOW: UC2 — Flux NVFP4

**Problem:** NVFP4 not started for Flux. But Flux.1-schnell (12B, 4-step) doesn't need quantization.

**Assessment:** This is correctly deprioritized in QR. MXFP8 coverage is sufficient for now. AutoRound does support diffusion quantization (Flux via transformer-only quantization) but loading quantized models is not yet supported (fake format only). This is an AutoRound limitation, not a QR gap.

### 3.4 What the QR DOES Cover Well

These are the successes worth noting:

| Model | QR Coverage | Quality |
|-------|------------|---------|
| Llama 3.1 70B | MXFP8 ✓, NVFP4 ✓, NVFP4+ ✓, FP8 KV/Attn ✓ | Excellent — multiple quantization levels with validated accuracy |
| DeepSeek-R1 | MXFP8 ✓ (v2), NVFP4 ✓, MXFP4 ✓, FP8 KV/Attn ✓ | Excellent — both CRI and JGS paths covered |
| Llama 3.1 8B | MXFP8 ✓, MXFP4 ✓ (AutoRound mixed, 7.55 avg bits) | Excellent — mixed-precision AutoRound for near-lossless compression |
| Qwen-235B | MXFP8 ✓, MXFP4 ✓, NVFP4 ✓, FP8 KV/Attn ✓ | Excellent |
| Llama 3.3 70B | MXFP8 ✓, MXFP4 ✓ | Good |
| Wan2.2 Video | FP8 ✓, MXFP8 ✓ (3 variants) | Good — shows Intel expanding beyond LLMs |

### 3.5 Cross-Reference: AutoRound Research Validation

The AutoRound accuracy data validates the QR recipes:

**MXFP4 g32 (CRI format):**
| Model | RTN | AutoRound | AutoRound+ |
|-------|-----|-----------|------------|
| Llama3.1-8B | 0.6212 | 0.6686 | 0.6732 |
| Qwen2-7.5B | 0.6550 | 0.6758 | 0.6809 |
| Phi4 | 0.7167 | 0.7247 | 0.7225 |
| Qwen3-32B | 0.6901 | 0.7211 | 0.7201 |

**NVFP4 g16 (JGS format):**
| Model | RTN | AutoRound | AutoRound+ |
|-------|-----|-----------|------------|
| Llama3.1-8B | 0.6876 | 0.6918 | 0.6965 |
| Qwen2-7.5B | 0.6906 | 0.6973 | 0.6989 |
| Phi4 | 0.7296 | 0.7306 | 0.7318 |
| Qwen3-32B | 0.7164 | 0.7306 | 0.7295 |

**Key finding:** AutoRound consistently outperforms RTN for both MXFP4 and NVFP4. NVFP4 AutoRound delivers accuracy very close to MXFP4 AutoRound despite using a different scale format. This validates the QR's approach of using AutoRound for NVFP4 on JGS.

Source: https://github.com/intel/auto-round/blob/main/docs/mxnv_acc.md

---

## PART 4: Consolidated Recommendations

### 4.1 Immediate Actions (This Sprint)

| Priority | Action | Owner | Effort |
|----------|--------|-------|--------|
| **P0** | Resolve DeepSeek-V3 gap: Option A (switch to R1), B (switch to Qwen-235B), or C (new recipe) | UR Team + Team B | 1 day decision; 4-6 weeks if Option C |
| **P1** | Update UR to specify JGS-native quantization formats (MXFP8, NVFP4, FP8 KV/Attn) | UR Team | 1-2 days |
| **P1** | Add FP8 KV Cache + FP8 Attention to all LLM use-cases in UR | UR Team | 1 day |
| **P1** | Validate DeepSeek-R1 NVFP4 for UC8 code+safety benchmarks | Team B | 1 week |
| **P2** | Track Llama4 Maverick NVFP4 recipe completion (QR WIP) | Team B | TBD |

### 4.2 Medium-Term (Next 2-4 Weeks)

| Priority | Action | Owner | Effort |
|----------|--------|-------|--------|
| **P1** | Develop DeepSeek-Coder-V2 NVFP4 recipe (if UC8 proceeds with Coder-V2) | Team B | 3-4 weeks |
| **P2** | Validate AutoRound VLM quantization for Llama 4 Maverick | Team B | 2-3 weeks |
| **P2** | Expand low-precision finetuning to NVFP4+ (currently only MXFP8 validated) | Team B | 2-3 weeks |
| **P3** | Add memory budget and latency SLA columns to UR | UR Team | 1 day |

### 4.3 Long-Term (Next Quarter)

| Action | Owner |
|--------|-------|
| Develop Mamba/SSM model quantization recipes (Falcon-Mamba, etc.) | Team B |
| Extend AutoRound diffusion quantization from "fake format" to loadable models | AutoRound Team |
| Create MoE-specific quantization guidelines (router sensitivity, expert-wise quantization) | Team B |
| Standardize UR ↔ QR format alignment (auto-generated gap detection) | Both Teams |

### 4.4 Architecture Reminder for Team A (UR)

```
╔══════════════════════════════════════════════════════════╗
║  IF YOUR USE-CASE TARGETS JGS:                           ║
║                                                          ║
║  8-bit quantization → Use MXFP8 (E4M3, E8M0, block 32)  ║
║  4-bit quantization → Use NVFP4 (E2M1, UE4M3, block 16) ║
║  KV Cache quant     → Use FP8 (E4M3, per-tensor)        ║
║  Native FP8 model   → Use directly (JGS supports FP8)    ║
║                                                          ║
║  DO NOT use MXFP4 on JGS — that's the CRI format.        ║
║  DO NOT use INT4/INT8 — not optimized for JGS hardware.  ║
║                                                          ║
║  Quantization algo: AutoRound (SignRound V1/V2)          ║
║  Reference: QR v0.9.7, Tables 1-3                        ║
╚══════════════════════════════════════════════════════════╝
```

---

## PART 5: Research Reference Index

| # | Reference | URL | Relevance |
|---|-----------|-----|-----------|
| 1 | AutoRound GitHub | https://github.com/intel/auto-round | Primary quantization toolkit for Intel GPU |
| 2 | AutoRound MX/NV Accuracy | https://github.com/intel/auto-round/blob/main/docs/mxnv_acc.md | MXFP4 g32 and NVFP4 g16 accuracy benchmarks |
| 3 | AutoRound Step-by-Step | https://github.com/intel/auto-round/blob/main/docs/step_by_step.md | Quantization schemes, export formats, CLI/API |
| 4 | AutoRound Diffusion Quant | https://github.com/intel/auto-round/blob/main/auto_round/compressors/diffusion/README.md | Flux, Z-Image quantization (transformer only) |
| 5 | AutoRound VLM Quant | https://github.com/intel/auto-round/blob/main/auto_round/compressors/mllm/README.md | VLM quantization (5 model families) |
| 6 | SignRound V1 Paper | https://arxiv.org/abs/2309.05516 | EMNLP 2024 — theoretical foundation |
| 7 | SignRound V2 Paper | https://arxiv.org/abs/2512.04746 | Dec 2025 — fast sensitivity + pre-tuning search |
| 8 | vLLM Quantization Docs | https://docs.vllm.ai/en/latest/features/quantization/ | vLLM inference with quantized models |
| 9 | HF Transformers Quantization | https://huggingface.co/docs/transformers/main/en/quantization/overview | Quantization method comparison matrix |
| 10 | Intel Neural Compressor | https://github.com/intel/neural-compressor | INC quantization (note: Intel Extension for PyTorch is being retired) |

---

## Appendix A: QR v0.9.7 Revision Timeline (Key Milestones)

| Date | Version | Change | Impact |
|------|---------|--------|--------|
| Jul 2025 | v0.1-0.4 | Initial structure, Llama 3.1 recipes | Foundation |
| Aug 2025 | v0.5-0.5.9 | Flux, Llama4 Scout, FP8 KV Cache, GPT-OSS, Qwen-235B | Major expansion |
| Sep 2025 | v0.6-0.6.9 | NVFP4+ for Llama 3.1 70B, Intel MXFP8 recipe for Llama 3.1 8B | NVFP4+ added |
| Oct 2025 | v0.6.7 | Remove NVFP4 from Llama 3.1 8B/3.3 70B; add NVFP4+ to 70B | Cleanup |
| Nov 2025 | v0.7.6-0.8.1 | Recipe formatting, SDPA/KV cache matrix, Flux T5 MXFP8 | Standardization |
| **Dec 2025** | **v0.8.2** | **Re-prioritize NVFP4 for JGS** | **Critical: JGS 4-bit path confirmed** |
| Dec 2025 | v0.8.4 | MXFP4 finetuning recipe added | Training quantization |
| Jan 2026 | v0.8.5-0.8.7 | vLLM-validated accuracy, FLOOR/CREIL rounding, v2 recipes | Validation + refinement |
| Mar 2026 | v0.9.0-0.9.3 | SDPA BF16, quantized ops update, v2 recipes standardized, Qwen RULER results | V2 recipe maturity |
| Apr 2026 | v0.9.4-0.9.7 | Common definitions doc, Wan2.2 video models (FP8 + MXFP8), GEMM output dtype | Video model expansion |

## Appendix B: QR Key Model Coverage — Complete Table

| Model | CRI MXFP8 | CRI MXFP4 | JGS MXFP8 | JGS NVFP4 | FP8 KV/Attn |
|-------|-----------|-----------|-----------|-----------|-------------|
| Llama 3.1 8B | ✓ | ✓ (AutoRound) | N/A | N/A | ✓ (v2) |
| Llama 3.1 70B | ✓ | N/A | ✓ (RTN) | ✓ (AutoRound) | ✓ (v2) |
| Llama 3.3 70B | ✓ | ✓ | N/A | N/A | ✓ (v2) |
| DeepSeek-R1 | ✓ (RTN) | ✓ (AutoRound) | ✓ (RTN) | ✓ (RTN) | ✓ (v2) |
| Qwen-235B | ✓ | ✓ | ✓ | ✓ | ✓ (v2) |
| GPT-OSS-120B | N/R | N/R (native) | N/R | N/R | N/A |
| Llama4 Maverick | N/R (native FP8) | N/A | N/R | **WIP** | Not validated |
| Llama4 Scout | N/R | ✓ | N/A | N/A | N/A |
| Flux | ✓ | N/R | ✓ | **Not started** | N/A |
| DLRM | N/A | N/A | **WIP** | **WIP** | N/A |
| Qwen3-30B-A3B | ✓ | N/R | N/A | N/A | N/A |
| WAN 2.2 T2V-14B | ✓ | N/R | N/A | N/A | N/A |
| WAN 2.2 I2V-14B | ✓ | N/R | N/A | N/A | N/A |
| WAN 2.2 S2V-14B | ✓ | N/R | N/A | N/A | N/A |
| FramePack | ✓ (FP8) | N/R | N/A | N/A | N/A |

---

**End of Report**
