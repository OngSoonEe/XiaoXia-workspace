# DOC 3 — Cross-Check: UR Quantization Needs × QR Coverage (Gap Analysis)

**Date:** 2026-05-05  
**Author:** OpenClaw AI Specialist  
**Documents Cross-Checked:** 
- UR (User Requirements) — 8 Finetune Use-Cases for Intel JGS (Team A)
- QR (Quantization Recipe) v0.9.7 — CRI/JGS Key Models (Team B / INC)

**Research References:**
- AutoRound MX/NV Accuracy Data: https://github.com/intel/auto-round/blob/main/docs/mxnv_acc.md
- AutoRound Diffusion Quantization: https://github.com/intel/auto-round/blob/main/auto_round/compressors/diffusion/README.md
- AutoRound VLM Quantization: https://github.com/intel/auto-round/blob/main/auto_round/compressors/mllm/README.md

---

## 1. QR Coverage Inventory (v0.9.7, April 2026)

### JGS Key Models (Table 3)
| Model | MXFP8 | NVFP4 | FP8 KV/Attn |
|-------|-------|-------|-------------|
| Llama 3.1 70B | ✓ (RTN) | ✓ (AutoRound) + NVFP4+ | ✓ (v2 recipe) |
| DeepSeek-R1 | ✓ (RTN) | ✓ (RTN) | ✓ (v2 recipe) |
| Llama4 Maverick | Not required (native FP8) | **WIP** | Not validated |
| Flux | ✓ (RTN) | **Not started** | N/A |
| DLRM | WIP | WIP | N/A |
| Qwen-235B | ✓ | ✓ | ✓ (v2 recipe) |

### CRI Key Models (Table 2)
| Model | MXFP8 | MXFP4 | FP8 KV/Attn |
|-------|-------|-------|-------------|
| Llama 3.3 70B | ✓ | ✓ | ✓ (v2) |
| Qwen3-30B-A3B | ✓ | Not required | N/A |
| Llama4 Scout | Not required | ✓ | N/A |
| Flux | ✓ | Not required | N/A |
| DeepSeek-R1 | ✓ (RTN) | ✓ (AutoRound) | ✓ (v2) |
| Llama 3.1 8B | ✓ | ✓ (AutoRound mixed, avg 7.55 bits) | ✓ (v2) |
| GPT-OSS-120B | Not required (native) | Not required (native) | N/A |
| Qwen-235B | ✓ | ✓ | ✓ (v2) |
| WAN 2.2 T2V-14B | ✓ | Not required | N/A |
| Wan2.2 I2V-14B-720P | ✓ | Not required | N/A |
| WAN 2.2 S2V-14B | ✓ | Not required | N/A |
| FramePack | ✓ (FP8) | Not required | N/A |

### Additional QR Sections
- **Section 4.2**: Low-precision finetuning — MXFP8 SFT and MXFP4 SFT validated for Llama 3.1 8B/70B
- **V2 recipes** (Mar 2026): FP8 KV Cache + FP8 Attention for Llama3, DeepSeek-R1, Qwen-235B
- **Wan2.2 video models** (Apr 2026): FP8 + MXFP8 for T2V, I2V, S2V

---

## 2. Gap Matrix: UR × QR

| UC# | Model | Quant Needs (from Doc 2) | QR Coverage | Gap Status | Details |
|-----|-------|--------------------------|-------------|------------|---------|
| **UC1** | Llama-3.1-70B | MXFP8, NVFP4+ | ✅ All covered | 🟢 **LOW GAP** | MXFP8 ✓, NVFP4 ✓, NVFP4+ ✓, FP8 KV/Attn ✓. Only gap: low-precision finetuning only validates MXFP8 (not NVFP4+). If UC1 wants NVFP4+ finetuning, this is unvalidated. |
| **UC2** | Flux.1-schnell | N/A (not required per Doc 2) | MXFP8 ✓, NVFP4 ✗ | 🟢 **NO GAP (optional)** | MXFP8 exists. NVFP4 not started but not needed for Schnell. Schnell is distilled 4-step — quantization benefits marginal. |
| **UC3** | Dense 30-70B | MXFP8 (70B only) | ✅ Covered if Llama 3.1 | 🟢 **LOW GAP** | If using Llama-3.1-70B for RAFT, recipe exists. If using a different 70B architecture, new recipe needed. 30B variant doesn't need quantization. |
| **UC4** | Llama 4 Maverick | Native FP8 → NVFP4 | FP8 ✓, NVFP4 WIP | 🟡 **MEDIUM GAP** | Native FP8 Maverick works today (Meta provides it). NVFP4 recipe is WIP — not blocking but limits optimization. FP8 KV/Attn not validated for Maverick in QR. |
| **UC5** | Llama 4 Maverick-style MoE | FP8 → NVFP4 | Same as UC4 | 🟡 **MEDIUM GAP** | Same as UC4. Additional risk: expert expansion + quantization interaction unexplored. Router quantization fidelity unknown. |
| **UC6** | DeepSeek-V3 (671B MoE) | MXFP8 + NVFP4 | ❌ **NOTHING** | 🔴 **BLOCKING GAP** | DeepSeek-V3 is NOT DeepSeek-R1. The QR covers DeepSeek-R1 (dense 70B) extensively but DeepSeek-V3 (671B MoE, 37B active) has ZERO coverage. This is the single largest gap in the entire analysis. Different architecture, different expert count, different quantization profile. A new recipe must be created from scratch. |
| **UC7** | Teacher 70B | MXFP8 (optional) | ✅ Covered if Llama 3.1 | 🟢 **LOW GAP** | If teacher is Llama-3.1-70B, recipe exists. Falcon-Mamba-7B student: no Mamba quantization in QR but student doesn't need quantization. |
| **UC8** | DeepSeek-R1 (70B) | MXFP8 + NVFP4 | ✅ Fully covered | 🟢 **LOW GAP** | Both MXFP8 and NVFP4 recipes exist. FP8 KV/Attn in v2 recipe. |
| **UC8** | DeepSeek-Coder-V2 (~236B MoE) | NVFP4 | ❌ **NOTHING** | 🔴 **HIGH GAP** | 236B MoE, 21B active. Completely different from DeepSeek-R1. No recipe exists. Only NVFP4 can fit all experts in 160GB. |

---

## 3. Gap Details & Team B Enablement Required

### 🔴 BLOCKING: UC6 — DeepSeek-V3 (Agentic RL)

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

### 🔴 HIGH: UC8 — DeepSeek-Coder-V2

**Problem:** 236B MoE with 21B active. All experts at FP16 = 472GB — won't fit JGS-D (160GB). Even MXFP8 all-experts = 236GB — still won't fit. Only NVFP4 (118GB) fits all experts with KV cache headroom.

**What Team B must do:**
1. Create NVFP4 recipe for DeepSeek-Coder-V2 MoE architecture — estimate 3-4 weeks
2. Validate on code benchmarks (HumanEval, MBPP, SWE-bench)
3. Validate on safety benchmarks (HarmBench, AdvBench)

**Mitigation:** If only active experts (21B) are loaded, FP16 fits (42GB). But code tasks benefit from full expert access for diverse programming languages.

### 🟡 MEDIUM: UC4/UC5 — Llama 4 Maverick NVFP4

**Problem:** NVFP4 recipe is WIP. Native FP8 model works today.

**What Team B must do:**
1. Complete NVFP4 recipe development — QR shows WIP status
2. Validate FP8 KV/Attn for Maverick's architecture
3. Test quantization with vision encoder (multimodal quantization is less mature)
4. AutoRound VLM support is experimental — needs validation on Maverick specifically

**Note:** AutoRound's VLM quantization only supports 5 model families (Qwen2-VL, Llama-3.2-Vision, Phi-3.5-vision, etc.). Llama 4 Maverick is not among them. This means the VLM quantization path needs significant development.

### 🟢 LOW: UC2 — Flux NVFP4

**Problem:** NVFP4 not started for Flux. But Flux.1-schnell (12B, 4-step) doesn't need quantization.

**Assessment:** This is correctly deprioritized in QR. MXFP8 coverage is sufficient for now. AutoRound does support diffusion quantization (Flux via transformer-only quantization) but loading quantized models is not yet supported (fake format only). This is an AutoRound limitation, not a QR gap.

---

## 4. Gap Summary Table

| Priority | UC# | Model | Gap | Status | Impact |
|----------|-----|-------|-----|--------|--------|
| **P0** | UC6 | DeepSeek-V3 | No MXFP8 or NVFP4 recipe | 🔴 BLOCKING | 671B MoE can't run on JGS-D without quantization |
| **P1** | UC8 | DeepSeek-Coder-V2 | No NVFP4 recipe | 🔴 HIGH | 236B MoE needs NVFP4 to fit all experts |
| **P2** | UC4/UC5 | Llama4 Maverick | NVFP4 WIP, FP8 KV/Attn not validated | 🟡 MEDIUM | FP8 native works; NVFP4 would optimize further |
| — | UC1 | Llama-3.1-70B | Low-precision finetuning for NVFP4+ | 🟢 LOW | All inference quant recipes exist |
| — | UC2 | Flux.1-schnell | NVFP4 not started | 🟢 LOW | Not needed; correctly deprioritized |
| — | UC3 | Dense 30-70B | Dependent on model choice | 🟢 LOW | Covered if using Llama 3.1 |
| — | UC7 | Teacher/Student | Mamba quantization | 🟢 LOW | Student doesn't need quant; teacher covered |

---

## 5. What the QR Does Cover Well (Successes)

| Model | QR Coverage | Quality |
|-------|------------|---------|
| Llama 3.1 70B | MXFP8 ✓, NVFP4 ✓, NVFP4+ ✓, FP8 KV/Attn ✓ | Excellent — multiple quantization levels with validated accuracy |
| DeepSeek-R1 | MXFP8 ✓ (v2), NVFP4 ✓, MXFP4 ✓, FP8 KV/Attn ✓ | Excellent — both CRI and JGS paths covered |
| Llama 3.1 8B | MXFP8 ✓, MXFP4 ✓ (AutoRound mixed, 7.55 avg bits) | Excellent — mixed-precision AutoRound for near-lossless compression |
| Qwen-235B | MXFP8 ✓, MXFP4 ✓, NVFP4 ✓, FP8 KV/Attn ✓ | Excellent |
| Llama 3.3 70B | MXFP8 ✓, MXFP4 ✓ | Good |
| Wan2.2 Video | FP8 ✓, MXFP8 ✓ (3 variants) | Good — shows Intel expanding beyond LLMs |

---

## 6. AutoRound Accuracy Validation (Validates QR Recipes)

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

## 7. QR v0.9.7 Revision Timeline (Key Milestones)

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

---

## 8. QR Key Model Coverage — Complete Table

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

## 9. Consolidated Recommendations

### Immediate Actions (This Sprint)
| Priority | Action | Owner | Effort |
|----------|--------|-------|--------|
| **P0** | Resolve DeepSeek-V3 gap: Option A (switch to R1), B (switch to Qwen-235B), or C (new recipe) | UR Team + Team B | 1 day decision; 4-6 weeks if Option C |
| **P1** | Update UR to specify JGS-native quantization formats (MXFP8, NVFP4, FP8 KV/Attn) | UR Team | 1-2 days |
| **P1** | Add FP8 KV Cache + FP8 Attention to all LLM use-cases in UR | UR Team | 1 day |
| **P1** | Validate DeepSeek-R1 NVFP4 for UC8 code+safety benchmarks | Team B | 1 week |
| **P2** | Track Llama4 Maverick NVFP4 recipe completion (QR WIP) | Team B | TBD |

### Medium-Term (Next 2-4 Weeks)
| Priority | Action | Owner | Effort |
|----------|--------|-------|--------|
| **P1** | Develop DeepSeek-Coder-V2 NVFP4 recipe (if UC8 proceeds with Coder-V2) | Team B | 3-4 weeks |
| **P2** | Validate AutoRound VLM quantization for Llama 4 Maverick | Team B | 2-3 weeks |
| **P2** | Expand low-precision finetuning to NVFP4+ (currently only MXFP8 validated) | Team B | 2-3 weeks |
| **P3** | Add memory budget and latency SLA columns to UR | UR Team | 1 day |

### Long-Term (Next Quarter)
| Action | Owner |
|--------|-------|
| Develop Mamba/SSM model quantization recipes (Falcon-Mamba, etc.) | Team B |
| Extend AutoRound diffusion quantization from "fake format" to loadable models | AutoRound Team |
| Create MoE-specific quantization guidelines (router sensitivity, expert-wise quantization) | Team B |
| Standardize UR ↔ QR format alignment (auto-generated gap detection) | Both Teams |

---

**End of Doc 3**