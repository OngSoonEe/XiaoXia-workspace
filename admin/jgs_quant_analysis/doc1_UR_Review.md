# DOC 1 — UR Recipe Correctness & Improvement Review

**Date:** 2026-05-05  
**Author:** OpenClaw AI Specialist  
**Document Analyzed:** UR (User Requirements) — 8 Finetune Use-Case Recipes for Intel JGS (Team A)

**Research References:**
- AutoRound GitHub: https://github.com/intel/auto-round
- AutoRound Step-by-Step: https://github.com/intel/auto-round/blob/main/docs/step_by_step.md
- SignRound V1 Paper: https://arxiv.org/abs/2309.05516 (EMNLP 2024)
- SignRound V2 Paper: https://arxiv.org/abs/2512.04746 (Dec 2025)
- vLLM Quantization Docs: https://docs.vllm.ai/en/latest/features/quantization/
- HuggingFace Transformers Quantization: https://huggingface.co/docs/transformers/main/en/quantization/overview

---

## 1. UR Use-Case Inventory (8 Finetune Recipes)

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

---

## 2. Overall UR Assessment

### What's Good
- Use-cases are well-scoped with clear models and frameworks
- Priority levels (P0-P3) are reasonable
- Multi-stage training pipelines (SFT → DPO/ORPO → GRPO) follow current best practices
- RLHF/GRPO/RLAIF methodology is state-of-the-art

### What's Wrong / Needs Improvement

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
| 6 | **No low-precision finetuning consideration** | UC1, UC6 | The QR (§4) validates MXFP8 and MXFP4 SFT finetuning for Llama 3.1 8B/70B. The UR doesn't specify whether finetuning happens in BF16 (then quantize for inference) or directly in low precision. This is a significant performance/accuracy decision. |
| 7 | **MoE model deployment strategy undefined** | UC4, UC5, UC6 | MoE models (Llama 4 Maverick 400B total, DeepSeek-V3 671B total) have only 17-37B active params. But whether ALL experts are loaded into vRAM or offloaded determines quantization need drastically. Not specified. |

#### 🟢 Lower-Impact / Refinement Issues

| # | Issue | Affected UCs | Notes |
|---|-------|-------------|-------|
| 8 | **Flux.1-schnell vs Flux.1-dev confusion** | UC2 | UR says "Flux.1 [Schnell]" but QR recipe is validated on Flux.1-dev. Schnell is a distilled 4-step variant — quantization behavior may differ. Validate on the correct variant. |
| 9 | **Distillation Teacher quantization undefined** | UC7 | Teacher (70B) inference drives the entire distillation pipeline speed. Quantizing the teacher with MXFP8 would accelerate distillation 2x without meaningfully affecting student quality. Not specified. |
| 10 | **No batching or latency SLA targets** | All | Without throughput/latency targets, it's impossible to determine whether quantization is necessary or just nice-to-have. |
| 11 | **Llama 4 Maverick appears twice (UC4 + UC5)** | UC4, UC5 | Different tasks (VLM vs domain MoE) but same model. If UC4 quantizes the model one way and UC5 a different way, conflicts arise. Need unified quantization strategy. |
| 12 | **Falcon-Mamba-7B (Student in UC7) — Mamba architecture** | UC7 | Mamba (SSM) models have different quantization characteristics than Transformer models. The QR has no Mamba/SSM recipes. If student needs quantization, this is a new architecture to support. |

---

## 3. Non-Quantization Improvements for UR

1. **Add hardware target column**: `Target: JGS-D (160GB, NVFP4/MXFP8)` vs `Target: CRI (96GB, MXFP4/MXFP8)`
2. **Add memory budget per UC**: "VRAM budget: 140GB for model + 20GB for KV cache + activations"
3. **Add quantization format column**: Mirroring QR's data type recommendation table
4. **Specify training precision**: BF16 training → MXFP8/NVFP4 inference, or MXFP8 training → NVFP4 inference
5. **Add KV cache quantization requirement**: "FP8 KV Cache + FP8 Attention (per QR v2 recipe)" for all LLM UCs
6. **Specify MoE loading strategy**: "All experts loaded (X GB)" or "Expert offloading (Y GB active)"
7. **Add AutoRound reference**: As the primary Intel quantization algorithm (SignRound V1/V2)
8. **Define success criteria**: Accuracy tolerance (e.g., "≤1% benchmark degradation at NVFP4")

---

## 4. Hardware Context — JGS vs CRI (Foundational)

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

## 5. Architecture Reminder for UR Team

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

**End of Doc 1**