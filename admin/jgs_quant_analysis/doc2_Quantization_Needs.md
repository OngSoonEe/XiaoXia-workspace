# DOC 2 — Which UR Recipes Require Quantization (Especially Low-Precision)

**Date:** 2026-05-05  
**Author:** OpenClaw AI Specialist  
**Document Analyzed:** UR (User Requirements) — 8 Finetune Use-Case Recipes for Intel JGS (Team A)  
**Question:** Which UR recipes genuinely require quantization, especially low-precision (NVFP4/MXFP4)?

**Research References:**
- AutoRound MXFP4/NVFP4 Accuracy Data: https://github.com/intel/auto-round/blob/main/docs/mxnv_acc.md
- AutoRound Diffusion Quantization: https://github.com/intel/auto-round/blob/main/auto_round/compressors/diffusion/README.md
- AutoRound VLM Quantization: https://github.com/intel/auto-round/blob/main/auto_round/compressors/mllm/README.md

---

## 1. VRAM Constraint Analysis

**JGS-D has 160GB vRAM.** This is the binding constraint. Let's calculate memory requirements:

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

---

## 2. Quantization Requirement Assessment

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

---

## 3. Quantization Priority Matrix

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

## 4. VRAM Savings by Quantization Level (for Key Models)

| Model | FP16 (GB) | MXFP8 (GB) | NVFP4 (GB) | NVFP4 Saving (%) |
|-------|-----------|------------|------------|------------------|
| Llama-3.1-70B | 140 | 70 | 35 | 75% |
| DeepSeek-V3 (active only) | 74 | 37 | 18.5 | 75% |
| DeepSeek-V3 (all experts) | ~1340 | ~670 | ~335 | 75% |
| DeepSeek-Coder-V2 (active only) | 42 | 21 | 10.5 | 75% |
| DeepSeek-Coder-V2 (all experts) | ~472 | ~236 | ~118 | 75% |
| Llama4 Maverick (active only) | 34 | 17 | 8.5 | 75% |
| Llama4 Maverick (all experts) | ~800 | ~400 | ~200 | 75% |

**Note:** KV cache, activations, and framework overhead add 20-60GB depending on context length and batch size. FP8 KV cache reduces this significantly.

---

## 5. Special Considerations

### 5.1 MoE Models — The Loading Strategy Question

MoE models are the biggest quantization decision driver:
- **Active-only loading (17-37B):** FP16 fits for some models, but KV cache headroom is slim. MXFP8 gives comfortable headroom.
- **All-experts loading (236B-671B):** Even MXFP8 doesn't fit for DS-Coder-V2 (236GB > 160GB). NVFP4 is the ONLY option.

For Agentic RL (UC6), all-experts loading is recommended because diverse tool-use patterns require access to different experts. This makes NVFP4 effectively mandatory.

### 5.2 The FP8 Native Advantage

JGS supports native FP8 compute. Meta ships Llama 4 Maverick in native FP8. This means:
- **UC4/UC5 can run today on JGS without any Team B quantization recipe** — just use Meta's FP8 model
- NVFP4 would further reduce memory (from 200GB all-experts to 100GB), but is not blocking

### 5.3 Flux.1-schnell — Why Quantization Is Not Needed

Flux.1-schnell is a 4-step distilled variant of Flux.1-dev (which needs 50+ steps). At 12B parameters and 4 inference steps:
- Memory: 24GB fits trivially in 160GB
- Speed: Already near real-time (4 steps vs 50+)
- Quantization gains: Marginal — quantization overhead may even slow down a 4-step model

AutoRound does support Flux diffusion quantization (transformer module only) but cannot yet load quantized models — this is experimental territory.

---

## 6. Summary: Only 3 of 8 UCs Genuinely REQUIRE Quantization

| Requires Quant | UCs | Reason |
|----------------|-----|--------|
| **YES — BLOCKING** | UC6 (DeepSeek-V3) | 671B MoE can't fit all experts even at MXFP8 |
| **YES — CRITICAL** | UC1 (70B SFT), UC8 (DS-R1) | 70B dense leaves no KV cache headroom at 32K context |
| **YES — HIGH** | UC8 (DS-Coder-V2) | 236B MoE only fits all experts at NVFP4 |
| **DEPENDS** | UC4/UC5 (Maverick MoE) | If active-only loading: no. If all-experts: yes. |
| **PARTIAL** | UC3 (30-70B), UC7 (70B teacher) | Only 70B variants need quantization |
| **NO** | UC2 (Flux.1-schnell), UC7 (student) | Models are small enough to fit comfortably |

---

**End of Doc 2**