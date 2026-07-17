# UR Use-cases with Quant Gaps — Detailed Report

**Date**: 2026-06-28
**Scope**: Use-cases from Intel JGS Finetune UR that need quantization AND have gaps in QR

---

## Use-case #2: Flux.1 [Schnell] Image Generation (P0)
**Owner**: Kah Lun

### Use-case Description
Flux.1-schnell (12B Rectified Flow Transformer) image generation with 32k-64k context. Interactive deployment.

### Quantization Needed
- **Format**: MXFP8 (weight + activation) or NVFP4
- **KV cache**: FP8 if interactive latency target
- **Text encoder**: T5 MXFP8

### Gap with QR
| Aspect | QR Status | Detail |
|--------|-----------|--------|
| JGS-specific Flux recipe | ❌ **Not started yet** | QR Table 3 explicitly marks JGS Flux as "Not started yet" |
| CRI Flux MXFP8 recipe | ✅ Ready | Table 35 — but uses E8M0 scale, not JGS UE4M3 |
| CRI Flux FP8 recipe | ✅ Ready | Table 34 — tensor-wise, not block-wise |
| T5 encoder quant | ⚠️ Partial | Mentioned in v0.8.1 but JGS-side unclear |

### Recommended Action
- **Short-term**: Use CRI MXFP8 recipe (Table 35) as proxy for JGS
- **Medium-term**: Create JGS-specific NVFP4 Flux recipe
- **Owner**: Team B (INC team)

---

## Use-case #4: High-res VLM SFT (P1)
**Owner**: Kah Lun

### Use-case Description
Llama 4 Maverick (MoE ~17B active) multi-image and short video understanding. Interactive deployment.

### Quantization Needed
- **Format**: NVFP4 (JGS preferred) or FP8 (official Meta)
- **Vision tower**: Currently excluded from quant — may need for high-res multi-image
- **KV cache**: FP8 for long context

### Gap with QR
| Aspect | QR Status | Detail |
|--------|-----------|--------|
| Llama4 Maverick NVFP4 (JGS) | ⚠️ **WIP** | Table 27 exists but Table 3 marks as WIP |
| Llama4 Maverick FP8 (official) | ✅ Ready | Table 26 — Meta's official FP8 recipe |
| Vision tower quant | ❌ Not covered | Excluded in both recipes (Tables 26, 27) |
| Multi-image/video handling | ❌ Not addressed | No recipe for video frame quant |

### Recommended Action
- **Short-term**: Use FP8 official (Table 26) as primary path
- **Medium-term**: Complete NVFP4 WIP; investigate vision tower quant
- **Owner**: Team B (INC team)

---

## Use-case #5: MoE Expert Expansion for Domains (P1)
**Owner**: Joshua

### Use-case Description
Llama 4 Maverick-style MoE with new domain-specific experts added. SFT on general + domain data, train router, add experts.

### Quantization Needed
- **Format**: Same as Maverick NVFP4
- **New experts**: Need separate calibration data
- **Router**: Currently excluded from quant

### Gap with QR
| Aspect | QR Status | Detail |
|--------|-----------|--------|
| Base Maverick NVFP4 | ⚠️ WIP | Same as #4 |
| MoE-with-new-experts quant | ❌ **No recipe** | Existing recipes calibrated for frozen MoE weights |
| Per-expert calibration | ❌ Not addressed | New experts need domain-specific calibration data |
| Hot-swappable experts | ❌ Not addressed | Deployment pattern not covered |

### Recommended Action
- **Short-term**: Complete Maverick NVFP4 first (prerequisite)
- **Medium-term**: Create "MoE + new experts" quant recipe with per-expert calibration
- **Owner**: Team B (INC team) + Team A (Joshua for calibration data)

---

## Use-case #6: Agentic RL for Tool-Using Agents (P2)
**Owner**: Melanie

### Use-case Description
DeepSeek-V3 (MoE 37B activated) agentic RL with tool-calling. Interactive agentic loop.

### Quantization Needed
- **Format**: NVFP4 or MXFP8
- **KV cache**: FP8 for long-horizon trajectories
- **vLLM compatibility**: Tool-calling rollouts need quant in vLLM path

### Gap with QR
| Aspect | QR Status | Detail |
|--------|-----------|--------|
| DeepSeek-V3 recipe | ❌ **No recipe** | Only DeepSeek-R1 exists |
| DeepSeek-R1 NVFP4 | ✅ Ready | Table 21 — proxy only |
| DeepSeek-R1 MXFP8 | ✅ Ready | Table 19 — proxy only |
| DeepSeek-R1 MXFP4 | ✅ Ready | Table 20 — proxy only |
| Tool-calling vLLM rollouts | ❌ Not addressed | No recipe for agentic inference path |

### Recommended Action
- **Short-term**: Use DeepSeek-R1 recipes as proxy with caveats
- **Medium-term**: Create DeepSeek-V3 specific recipe (V3 ≠ R1)
- **Owner**: Team B (INC team)

---

## Use-case #7: Large→Small Distillation for Deploy (P3)
**Owner**: —

### Use-case Description
Llama4 → Falcon-Mamba-7B cross-architecture knowledge distillation. Student model explicitly for deployment.

### Quantization Needed
- **Format**: Unknown — SSM quant is unproven
- **Weight quant**: Likely MXFP8 or NVFP4
- **Activation quant**: SSM scans are element-wise, not GEMM-heavy

### Gap with QR
| Aspect | QR Status | Detail |
|--------|-----------|--------|
| Falcon-Mamba recipe | ❌ **No recipe** | Not in QR at all |
| Any SSM/Mamba recipe | ❌ **No recipe** | QR only covers Transformer and multimodal |
| Cross-arch KD quant | ❌ **No recipe** | Student quant after cross-arch KD is unproven |
| SSM quant sensitivity | ❌ Unknown | Different from Transformer — needs research |

### Recommended Action
- **Research phase**: Investigate Mamba SSM quant feasibility first
- **If feasible**: Create new SSM quant recipe class in QR
- **Owner**: Team B (INC team) + research

---

## Use-case #8: Execution-Grounded Code Model (P3)
**Owner**: —

### Use-case Description
DeepSeek-Coder-V2 (MoE 16B activated, 236B total) code model with sandbox execution. Interactive (Copilot-style) or batch.

### Quantization Needed
- **Format**: MXFP8 or NVFP4
- **Calibration data**: Code samples, not general text
- **Long-context**: Whole-repo code handling

### Gap with QR
| Aspect | QR Status | Detail |
|--------|-----------|--------|
| DeepSeek-Coder-V2 recipe | ❌ **No recipe** | Not in QR |
| DeepSeek-R1 (proxy) | ✅ Ready | Tables 19-21 — but different architecture |
| Code-specific calibration | ❌ Not addressed | Code has different token distribution |
| Long-context code | ❌ Not addressed | Whole-repo context not validated |

### Recommended Action
- **Short-term**: Use DeepSeek-R1 recipes as proxy with code calibration data
- **Medium-term**: Create DeepSeek-Coder-V2 specific recipe
- **Owner**: Team B (INC team)

---

## Cross-Cutting Gaps

### GAP-A: Reward Model Quantization
- **Affects**: #1 (GRPO), #6 (Agentic RL), #9 (RLAIF/RLHF)
- **Models**: Reward models (7-13B, e.g., Skywork, InternLM2-Reward)
- **QR coverage**: None
- **Workaround**: BF16 inference (reward models are small enough)
- **Recommendation**: Document as known gap; add to QR if JGS has unified quant infra

### GAP-B: RAG Pipeline Components
- **Affects**: #3 (RAFT + RAG-native)
- **Models**: Embedding (BGE, E5), Reranker (BGE-reranker, Cohere)
- **QR coverage**: None
- **Workaround**: INT8 for embeddings (standard practice)
- **Recommendation**: Add to QR if RAG is a priority deployment scenario

### GAP-C: Long-Context (128k+) Validation
- **Affects**: #1, #3, #9
- **Evidence**: Qwen-235B RULER test shows ~50% accuracy drop at 128k (Table 23)
- **QR coverage**: Only Qwen-235B tested at 128k
- **Recommendation**: Validate all long-context use-cases at target context length

### GAP-D: Vision Tower Quant in VLM
- **Affects**: #4 (High-res VLM)
- **Models**: Vision encoder in Llama4 Maverick
- **QR coverage**: Excluded from quant (Tables 26, 27)
- **Workaround**: Keep vision tower in BF16
- **Recommendation**: Investigate if vision tower quant is needed for high-res multi-image

---

*End of gap report. See companion files for full analysis methodology.*
