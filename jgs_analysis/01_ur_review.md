# Step 1: UR Review — Intel JGS Finetune Recipe

## Context on Intel JGS (JaguarShore)

Based on the QR document (Quantization Recipe for CRI/JGS Key Models, v0.9.4-0.9.7 by INC team), the relevant facts about JGS:

- **JGS** = Intel's next-gen GPU (codename "JaguarShore")
- Native precision: BF16 / FP16 / **FP8**
- Recommended quant formats: **NVFP4 (E2M1 + UE4M3 scale)** and **MXFP8 (E4M3 + E8M0 scale)**
- Distinct from CRI (which favors MXFP8/MXFP4 only)
- Note: JGS supports NVIDIA-style NVFP4 — suggests NVLink/IPC-style data format alignment

## The UR (Use-case Recipe) — 9 finetune use-cases

| # | Recipe | Priority | Owner |
|---|--------|----------|-------|
| 1 | SFT LoRA → DPO → GRPO | P0 | Melanie |
| 2 | Flux.1 [Schnell] Image Generation | P0 | Kah Lun |
| 3 | Retrieval-Aware Finetuning (RAFT) + RAG-native | P0 | Joshua |
| 4 | High-res VLM SFT (multi-image and short video) | P1 | Kah Lun |
| 5 | MoE Expert Expansion for Domains | P1 | Joshua |
| 6 | Agentic RL for Tool-Using Agents | P2 | Melanie |
| 7 | Large→Small Distillation for deploy | P3 | — |
| 8 | Execution-Grounded Code Model | P3 | — |
| 9 | Safety & Policy Alignment at Scale | P3 | — |

## Critical Observations / Issues in UR

### 1. Priority classification is reasonable but has gaps

The P0/P1/P2/P3 split is by **production criticality**, not by quant-need. That's fine for a use-case plan, but it doesn't directly tell us quant priority.

### 2. Some recipes are clearly **DEPLOYMENT-oriented** vs **TRAINING-oriented**

- **Deployment-targeted** (model will be served after training): #1 (instruction-tuned chat), #2 (image gen), #3 (RAG), #4 (VLM), #5 (MoE serving), #6 (agentic), #9 (safety-tuned)
- **Training-only / research-oriented**: #7 (distillation — produces a smaller deployable model), #8 (code model training)
- **Hybrid**: #7 (training produces a model that gets deployed — Falcon-Mamba-7B is the output)

### 3. Recipe #7 has a suspicious model pairing

> Teacher: 70B → Student: 7-14B (Llama 4 → Falcon-Mamba-7B)

Cross-architecture distillation (Llama 4 Transformer → Falcon-Mamba SSM) is hard. KD with logits + rationales is sensible, but `optional DPKD (preference KD)` for a hybrid arch is very ambitious. Worth flagging.

### 4. Recipe #5 — MoE Expert Expansion

> SFT on general + domain data; train router + add domain-specific experts
> Llama 4 Maverick-style MoE

This is a **training recipe for creating new MoE experts**, not a quantization recipe. Quantization happens at deploy time. The UR conflates "finetune" with quant need.

### 5. Recipe #2 mentions 32k-64k context — does JGS have enough memory?

Not stated in UR. Need to confirm against JGS specs.

### 6. Recipe #6 — Agentic RL on DeepSeek-V3 37B activated

37B activated MoE training is heavy. PEFT is listed as "optional" — should be required for memory budget on JGS.

### 7. Missing cross-cutting concerns in UR

- **No mention of eval benchmarks** per recipe
- **No reproducibility / seed control** mentioned
- **No checkpoint / sharding strategy** for JGS multi-GPU
- **No data governance / PII** notes (esp. for #3 RAG and #6 agentic)
- **No safety review checkpoint** for #9 despite being the safety recipe itself

## Summary of UR concerns

1. **Mixes concerns** — confuses "finetune recipe" with "model architecture choice"
2. **No quant context** — doesn't say which models will be quantized after training
3. **Priority ≠ quant need** — need a separate axis for quant priority
4. **Some recipes are deployment-only** (#5 MoE expansion trains experts, but the trained model needs quant)
5. **Recipe #7 cross-arch KD is risky** — Llama4 → Falcon-Mamba
6. **No infra/memory budget** for JGS