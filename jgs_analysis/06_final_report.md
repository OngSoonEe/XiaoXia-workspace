# JGS Finetune UR ↔ QR Gap Analysis — Compiled Report

**Date**: 2026-06-28
**Author**: XiaoXia (automated analysis)
**Scope**: Intel JaguarShore (JGS) finetune use-case recipe (UR, Team A) vs Quantization Recipe (QR, Team B)

---

## Executive Summary

The UR lists 9 finetune use-cases for JGS. After analysis:

- **3 use-cases** have clean QR coverage for their primary model
- **6 use-cases** have at least one major quant gap
- **1 use-case** (Falcon-Mamba-7B) has **zero** QR coverage — entire model class missing
- **4 cross-cutting gaps** affect multiple use-cases

---

## Part A: UR Review — Issues Found

### A1. Priority ≠ Quant Need
UR's P0/P1/P2/P3 is business priority, not quant urgency. #2 (Flux, P0) has "Not started yet" for JGS. #7 (Mamba, P3) has the biggest quant gap.

### A2. Missing Quant Dimension
UR doesn't specify which models need quantization after finetuning, or at what precision (NVFP4 vs MXFP8).

### A3. Some Recipes are Deployment-Only
#5 (MoE Expert Expansion) trains new experts — quantization is a deployment concern, not training.

### A4. Cross-Arch Distillation Risk
#7 (Llama4 → Falcon-Mamba-7B) is cross-architecture KD. Even without quant, this is research-grade.

### A5. No Infra/Memory Budget
UR doesn't state JGS memory constraints per use-case.

### A6. Missing Cross-Cutting Concerns
No eval benchmarks, reproducibility, checkpoint strategy, or data governance mentioned.

---

## Part B: Quantization Need Assessment

| # | Use-case | Quant Needed? | Rationale |
|---|----------|--------------|-----------|
| 1 | SFT LoRA → DPO → GRPO (Llama-3.1-70B) | ✅ | 70B interactive chat model |
| 2 | Flux.1 Schnell Image Gen (12B) | ✅ | Interactive image gen, memory-bound |
| 3 | RAFT + RAG-native (Llama-3.1-70B) | ✅ | Interactive RAG pipeline |
| 4 | High-res VLM SFT (Llama4 Maverick) | ✅ | Multi-image/video, memory-bound |
| 5 | MoE Expert Expansion (Maverick-style) | ⚠️ | Complex — quant of new experts unproven |
| 6 | Agentic RL (DeepSeek-V3 37B) | ✅ | Agentic loop is latency-sensitive |
| 7 | Distill → Falcon-Mamba-7B | ✅ | Explicitly "for deploy" |
| 8 | Code Model (DeepSeek-Coder-V2) | ✅/⚠️ | Interactive (Copilot) or batch |
| 9 | Safety/Policy (DeepSeek-R1 70B) | ✅ | Deployed safety-tuned model |

---

## Part C: QR Coverage — JGS Key Models

Per QR Table 3, JGS currently covers only **5 models**:

| Model | MXFP8 | NVFP4 | Status |
|-------|-------|-------|--------|
| Llama 3.1 70B | ✅ | ✅ | Ready |
| DeepSeek-R1 | ✅ | ✅ | Ready |
| Llama4 Maverik | N/A | ⚠️ WIP | NVFP4 recipe in progress |
| Flux | ✅ | ❌ Not started | Only MXFP8 ready for JGS |
| DLRM | ⚠️ WIP | ⚠️ WIP | Both in progress |

---

## Part D: Gap Analysis — Use-cases with Quant Need + QR Gaps

### GAP-1: Flux.1 Schnell on JGS (Use-case #2)
- **Owner**: Kah Lun | **Priority**: P0
- **Quant needed**: MXFP8 or NVFP4
- **QR status**: JGS-specific Flux recipe: **"Not started yet"** (Table 3)
- **Impact**: P0 use-case has no JGS quant path
- **Recommendation**: Use CRI MXFP8 recipe as proxy, or prioritize JGS NVFP4 Flux recipe

### GAP-2: Llama4 Maverick NVFP4 on JGS (Use-cases #4, #5)
- **Owner**: Kah Lun, Joshua | **Priority**: P1
- **Quant needed**: NVFP4
- **QR status**: **WIP** (Table 3, Table 27)
- **Impact**: Affects 2 use-cases. FP8 official is ready (Table 26) but NVFP4 is not
- **Recommendation**: Use FP8 official as primary path; NVFP4 is optimization

### GAP-3: MoE with New Experts (Use-case #5)
- **Owner**: Joshua | **Priority**: P1
- **Quant needed**: NVFP4 + new expert handling
- **QR status**: **No recipe** for "MoE + new experts"
- **Impact**: Structural quant gap — existing recipes calibrated for frozen MoE weights
- **Recommendation**: New experts need separate calibration data and recipe

### GAP-4: DeepSeek-V3 (Use-case #6)
- **Owner**: Melanie | **Priority**: P2
- **Quant needed**: NVFP4 or MXFP8
- **QR status**: **No DeepSeek-V3 recipe** — only DeepSeek-R1 (proxy)
- **Impact**: V3 ≠ R1. Different routing patterns, activation distributions
- **Recommendation**: Create V3-specific recipe; R1 proxy is risky

### GAP-5: Falcon-Mamba-7B / SSM (Use-case #7)
- **Owner**: — | **Priority**: P3
- **Quant needed**: 7B SSM for deployment
- **QR status**: **No SSM/Mamba recipe at all**
- **Impact**: Entire model class missing from QR. SSM has different quant sensitivity vs Transformer
- **Recommendation**: Research Mamba quant feasibility first; may need new recipe class

### GAP-6: DeepSeek-Coder-V2 (Use-case #8)
- **Owner**: — | **Priority**: P3
- **Quant needed**: MXFP8 or NVFP4
- **QR status**: **No DeepSeek-Coder-V2 recipe**
- **Impact**: Different tokenizer/vocabulary from R1; code data has different token distribution
- **Recommendation**: Create V2-specific recipe with code calibration data

---

## Part E: Cross-Cutting Gaps

### GAP-A: Reward Model Quantization
- **Affects**: #1 (GRPO), #6 (Agentic RL), #9 (RLAIF/RLHF)
- **QR coverage**: None
- **Severity**: Medium — reward models are typically 7-13B, can use BF16 fallback

### GAP-B: RAG Pipeline Components
- **Affects**: #3 (RAFT + RAG-native)
- **QR coverage**: None for embedding/reranker models
- **Severity**: Medium — RAG latency depends on these but they're smaller

### GAP-C: Long-Context (128k+) Validation
- **Affects**: #1, #3, #9
- **QR coverage**: Qwen-235B RULER test shows ~50% accuracy drop at 128k (Table 23)
- **Severity**: High — critical for RAG/safety use-cases

### GAP-D: Vision Tower Quant in VLM
- **Affects**: #4 (High-res VLM)
- **QR coverage**: Vision tower is in exclude list (Tables 26, 27)
- **Severity**: Medium — vision tower is small relative to LLM

---

## Part F: Independent Observations

1. **QR's JGS scope is thin** — only 5 models vs CRI's 14. JGS recipe work is clearly behind CRI.
2. **QR Section 4 (Low Precision Finetuning)** only covers Llama-3.1-8B and 70B. 6 of 9 UR recipes have no finetune-time quant recipe.
3. **KV cache strategy is inconsistent** across recipes — some use FP8 KV, some BF16. UR should specify per use-case.
4. **NVFP4 vs MXFP8 choice** depends on accuracy requirements. For agentic/code use-cases, MXFP8 may be safer.
5. **Llama4 Maverick FP8 official is ready** — use it as primary path for #4 and #5. NVFP4 is optimization.
6. **DeepSeek model family confusion** — UR mentions V3, Coder-V2, and R1. QR only has R1. These are different architectures.
7. **QR is well-maintained** (v0.9.7) but organized by model, not by use-case. A "use-case → recipe" crosswalk is missing.

---

## Part G: Recommendations

1. **Sync Team A and Team B** on scope alignment before committing to UR as-is
2. **Add quant dimension to UR priority** — separate "business priority" from "quant readiness"
3. **Use FP8 official for Llama4 Maverick** as primary path; NVFP4 is optimization
4. **Create DeepSeek-V3 and DeepSeek-Coder-V2 recipes** — R1 proxy is insufficient
5. **Research Mamba SSM quant feasibility** before committing to #7
6. **Validate long-context quant** for all use-cases with 32k+ context
7. **Document reward model and RAG component quant** as known gaps with BF16 fallback
8. **Create use-case → recipe crosswalk** document to bridge UR and QR

---

*End of compiled report. See companion files for detailed analysis.*
