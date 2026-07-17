# Step 2: Quantization Need Analysis per UR Use-case

## Framework: When does quantization actually matter?

Quantization is needed at **inference / deployment** time, not training time. The UR is a finetune recipe, but the *output* of finetuning is a model that will be served. So the question is:

> "After this finetune completes, will the resulting model be deployed in a memory-/latency-constrained way on JGS that benefits from quantization?"

**Two key factors:**
1. **Model size after finetune** — bigger models benefit more from weight quantization
2. **Deployment latency target** — interactive use cases (chat, agentic) need low-latency inference; offline batch jobs don't

I will mark each use-case as:
- ✅ **QUANT NEEDED** — model will be deployed at scale, latency-sensitive, or memory-bound
- ⚠️ **MAYBE** — quant helps but not critical, or quant is post-finetune engineering concern, not in UR scope
- ❌ **NOT NEEDED** — pure training/research recipe; deployment quant is downstream

## Per use-case analysis

### #1 — SFT LoRA → DPO → GRPO (P0) — Melanie
- **Output model**: Llama-3.1-70B (already base is large)
- **Deployment**: Yes, instruction-tuned chat model — interactive
- **Quant need**: ✅ **QUANT NEEDED**
- **Target format**: 70B is the canonical JGS NVFP4 target (Table 3 shows Llama 3.1 70B NVFP4 ✓)
- **LoRA note**: After full pipeline, LoRA is merged into base; final model is still 70B dense
- **GRPO side**: 32k-64k context needs KV cache + attention quant on top of weight quant

### #2 — Flux.1 [Schnell] Image Generation (P0) — Kah Lun
- **Output model**: Flux.1-schnell (12B Rectified Flow Transformer)
- **Deployment**: Yes — image gen is interactive
- **Quant need**: ✅ **QUANT NEEDED**
- **Target format**: QR has Flux MXFP8 ✓ (CRI side, not JGS specifically — Table 3 says "Not started yet" for JGS)
- **GAP**: JGS-side Flux recipe status: **Not started yet** per QR Table 3
- **VRAM concern**: 12B image model with 32k context — needs both weight and KV quant

### #3 — RAFT + RAG-native (P0) — Joshua
- **Output model**: Llama-3.1-70B base (32k context)
- **Deployment**: Yes — RAG retrieval pipeline, interactive
- **Quant need**: ✅ **QUANT NEEDED**
- **Target format**: Llama 3.1 70B NVFP4 / MXFP8 both have recipes
- **Long context**: 32k context means KV cache quant is critical here too
- **RAG-specific**: Embedding model for retrieval is separate — NOT covered by UR or QR

### #4 — High-res VLM SFT (P1) — Kah Lun
- **Output model**: Llama 4 Maverick (MoE ~17B active)
- **Deployment**: Yes — multi-image / video understanding
- **Quant need**: ✅ **QUANT NEEDED**
- **Target format**: QR has Llama4 Maverick **FP8 (official from Meta)** and **NVFP4 (WIP for JGS)** — Table 3
- **GAP**: NVFP4 Maverick for JGS is **WIP** (Work In Progress)
- **Note**: Maverick is the JGS showcase model since it natively supports FP8 — quant story is cleaner here

### #5 — MoE Expert Expansion for Domains (P1) — Joshua
- **Output model**: Llama 4 Maverick-style MoE (with new domain experts added)
- **Deployment**: Yes — but custom MoE routing changes inference path
- **Quant need**: ⚠️ **MAYBE / COMPLEX**
- **Issue**: UR trains **new experts** — added experts need their own calibration data
- **Quant target**: Same as #4 (Llama4 Maverick NVFP4)
- **GAP**: No recipe for **MoE-with-new-experts** quant path. Existing Llama4 Maverick NVFP4 recipe was calibrated on the original 128E model, not domain-expanded variants

### #6 — Agentic RL for Tool-Using Agents (P2) — Melanie
- **Output model**: DeepSeek-V3 (MoE 37B activated)
- **Deployment**: Yes — agentic loop is latency-sensitive
- **Quant need**: ✅ **QUANT NEEDED**
- **Target format**: QR has DeepSeek-R1 (similar arch) — **MXFP8 ✓** and **NVFP4 ✓** for JGS
- **Issue**: DeepSeek-V3 is NOT DeepSeek-R1. R1 recipe is a **proxy**. Need separate V3 recipe
- **GAP**: **No DeepSeek-V3 specific recipe** in QR (only R1)
- **vLLM note**: Tool-calling rollouts are vLLM heavy → quant must work in vLLM path

### #7 — Large→Small Distillation for deploy (P3)
- **Output model**: Falcon-Mamba-7B (SSM, not Transformer)
- **Deployment**: Yes — explicitly "for deploy"
- **Quant need**: ✅ **QUANT NEEDED**
- **Target format**: ⚠️ **No Falcon-Mamba recipe in QR at all**
- **GAP**: **No SSM / Mamba quant recipe**. QR only covers Transformer (Llama family, DeepSeek, Qwen) and a few multimodal (Flux, FramePack, Wan)
- **Additional concern**: SSM has different quant sensitivity vs Transformer. Mamba SSM scans are element-wise / conv-like, not GEMM-heavy. Quant benefit may be smaller than for Transformer
- **Cross-arch KD**: Llama4 → Mamba is rare — quant of student is even less standard

### #8 — Execution-Grounded Code Model (P3)
- **Output model**: DeepSeek-Coder-V2 (Dense or MoE 30-70B)
- **Deployment**: Code completion can be interactive (Copilot-style) or batch
- **Quant need**: ✅ **QUANT NEEDED** (if interactive) or ⚠️ **MAYBE** (if batch)
- **Target format**: QR doesn't list DeepSeek-Coder-V2 specifically
- **GAP**: **No DeepSeek-Coder-V2 recipe**. Closest is DeepSeek-R1 (similar MoE arch for the 30-70B MoE variant)

### #9 — Safety & Policy Alignment at Scale (P3)
- **Output model**: DeepSeek-R1 (Dense 70B)
- **Deployment**: Yes — safety-tuned models are deployed
- **Quant need**: ✅ **QUANT NEEDED**
- **Target format**: DeepSeek-R1 MXFP8 ✓ and NVFP4 ✓ (both on JGS per QR Table 3)
- **Reward model note**: UR mentions "reward models" — these are typically smaller (e.g., 7B) and need their own quant recipe. Not specified in QR
- **Multi-objective GRPO**: SFT step has same quant story as #1

## Summary table

| # | Recipe | Quant needed? | Target format (per QR) | Gap? |
|---|--------|---------------|------------------------|------|
| 1 | SFT LoRA → DPO → GRPO | ✅ | NVFP4 / MXFP8 | No |
| 2 | Flux.1 Schnell | ✅ | MXFP8 (CRI), JGS WIP | ⚠️ JGS Flux: Not started |
| 3 | RAFT + RAG | ✅ | NVFP4 / MXFP8 | No |
| 4 | VLM SFT (Llama4 Maverick) | ✅ | FP8 (off), NVFP4 (WIP) | ⚠️ NVFP4 JGS: WIP |
| 5 | MoE Expert Expansion | ⚠️ | Same as Maverick | ⚠️ MoE-with-new-experts not covered |
| 6 | Agentic RL (DS-V3) | ✅ | DS-R1 proxy only | ⚠️ DS-V3 not covered |
| 7 | Distill to Falcon-Mamba-7B | ✅ | None | ⚠️ **No Mamba recipe** |
| 8 | Code Model (DS-Coder-V2) | ✅/⚠️ | None | ⚠️ DS-Coder-V2 not covered |
| 9 | Safety/Policy (DS-R1) | ✅ | MXFP8 / NVFP4 | ⚠️ Reward model not covered |

## Quant use-cases to focus on (Step 3 cross-check)

8 of 9 use-cases have at least one **gap** in QR coverage. Only #1, #3, and #9 are cleanly covered for the primary model.