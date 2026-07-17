# Independent Observations & Critical Thoughts

This section captures my own analysis — not from the UR or QR documents. Things I noticed that I think warrant attention even if Jack didn't ask for them explicitly.

## 1. UR is missing a quant dimension on its priority axis

The UR's P0/P1/P2/P3 priority is about **business importance**, not about **quant urgency**. Concretely:

- #5 (MoE Expert Expansion) is P1 — but quant is structurally hard here
- #2 (Flux) is P0 — but QR explicitly says "not started yet" for JGS
- #7 (Mamba distillation) is P3 — but it's the use-case with the **biggest** quant gap (zero coverage)

If Team B's QR prioritization is by "model size + deployment likelihood," then the gap matrix I produced is what matters. But Team A should know: **priority P doesn't equal quant readiness**.

## 2. QR's JGS scope seems incomplete vs CRI

Looking at QR Table 2 (CRI Key Models, 14 models) vs Table 3 (JGS Key Models, 6 models):

CRI list: Llama 3.3 70B, Qwen3-30B-A3B, Llama4 Scout, Flux, DeepSeek-R1, Llama 3.1 8B, GPT-OSS-120B, Qwen-235B, Qwen3-32B, WAN 2.2 T2V-14B, Wan2.2-I2V-14B-720P, WAN 2.2 S2V-14B, FramePack

JGS list: Llama 3.1 70B, DeepSeek-R1, Llama4 Maverik, Flux, DLRM

**JGS list is suspiciously short** — only 5 models. For a flagship GPU targeting NVFP4 workloads, this seems thin. Some possibilities:
- JGS is newer and recipe work is ongoing (likely)
- JGS is positioned for fewer model classes (less likely)
- QR's "JGS Key Models" list is just the **already-supported** set, with more in pipeline (most likely)

**My read**: Team B may need to expand the JGS scope to match CRI's breadth, especially for the models in UR.

## 3. QR Section 4 (Low Precision Finetuning) is severely limited

Section 4 only covers **Llama-3.1-8B-Instruct** and **Llama-3.1-70B-Instruct** for low-precision finetuning (FP8, MXFP8, MXFP4).

The UR has 9 finetune recipes — only #1, #3, #9 (all Llama-based) would benefit from existing Section 4 recipes. The rest are:
- Flux (#2) — image gen
- Llama 4 Maverick (#4, #5) — MoE
- DeepSeek-V3 (#6) — MoE
- Mamba (#7) — SSM
- DeepSeek-Coder-V2 (#8) — MoE

So **6 of 9 UR recipes have no finetune-time quant recipe in QR Section 4**. This is a big gap if the goal is to do low-precision training on JGS.

## 4. The KV cache / Attention story is inconsistent across recipes

Looking at QR:
- Some models use **FP8 KV + FP8 Attention** (Llama 3.1 8B Table 4, Llama 3.3 70B Table 11)
- Some use **BF16 KV + BF16 Attention** (e.g., Llama4 Scout Table 29 — but actually that table says FP8 KV + FP8 Attention, with BF16 KV tested separately in Table 31)
- For DeepSeek-R1 MXFP8: results in Table 18 show "FP8 KV + FP8 Attention" actually IMPROVES gsm8k (0.9591 → 0.9606)

**Observation**: The KV/Attn choice is not consistent across models — it depends on:
- Model size (smaller models tolerate FP8 KV better)
- Context length (longer context → KV quant helps more)
- Calibration data quality

The UR doesn't specify KV cache strategy per use-case, but it should — especially for #1 (32-64k context) and #3 (32k context).

## 5. MXFP4 vs NVFP4: JGS preference is unclear

QR Table 1 says JGS's "best model w/ Quantization Dtype" is **NVFP4 (UE4M3 scale)**. But:
- Several JGS recipes use **MXFP8** (e.g., Llama 3.1 70B Table 7, DeepSeek-R1 Table 19)
- Some use **NVFP4+** (Llama 3.1 70B Table 9 — this is "NVFP4 without global scale")

**My read**: JGS supports **both** MXFP8 and NVFP4 — but NVFP4 is the more aggressive 4-bit format. For use-cases where 4-bit accuracy is borderline (like #6 agentic, #8 code), MXFP8 may be the safer choice.

The UR doesn't make this distinction. Team A should be explicit about whether each finetune recipe is targeting 4-bit (NVFP4) or 8-bit (MXFP8) deployment.

## 6. DeepSeek model family confusion

UR mentions:
- #6: **DeepSeek-V3** (MoE 37B activated)
- #8: **DeepSeek-Coder-V2** (Dense or MoE 30-70B)
- #9: **DeepSeek-R1** (Dense 70B)

QR only has **DeepSeek-R1** recipes. The architectures differ:
- R1 is dense 70B
- V3 is MoE 37B activated (671B total) — much larger
- Coder-V2 is MoE 16B activated (236B total) — medium

The R1 recipe is the **least applicable** proxy for V3 (different MoE structure). For Coder-V2, R1 is a slightly better proxy (both are MoE).

## 7. Llama 4 Maverick as UR use-case backbone

Use-cases #4 and #5 both target Llama 4 Maverick. The QR says:
- Maverick is natively **FP8** (Meta released an FP8 version)
- NVFP4 is **WIP**

This means:
- For deployment, Maverick can be served as **native FP8** on JGS (no extra quant work!)
- NVFP4 is for **further memory reduction** — but the recipe isn't ready

**Recommendation**: For UR #4, **use FP8 official (no quant)** as primary path. NVFP4 is an optimization, not a requirement. This simplifies the path significantly.

## 8. GRPO/RLAIF reward models — underrated gap

UR mentions reward models in #1, #6, #9 but doesn't specify:
- What model architecture (Llama? Skywork? Custom?)
- What size
- Whether it's deployed on JGS or a separate CPU/GPU cluster

If reward models run on JGS, they need their own quant recipe. QR has nothing for this.

## 9. The QR document is mature — but UR ↔ QR mapping is missing

QR is at v0.9.7 (very mature, well-maintained). But it's organized **by model**, not by use-case. A "use-case → recipe" crosswalk would be valuable.

Example: If I were Team B and got the UR, I'd want to write something like:
> "Use-case #1 → Llama-3.1-70B NVFP4 recipe (Table 8) + Llama-3.1-70B NVFP4+ recipe (Table 9) — both ready. Long-context FP8 KV cache recipe (Section 4 of Llama-3.3-70B Table 11) applies."

This document doesn't exist in QR. It would be a useful artifact.

## 10. Some UR choices are questionable from a quant-readiness perspective

- **#5 MoE with new experts** — even before quant, this is structurally hard. Quant makes it harder. Maybe reconsider scope.
- **#7 Llama4 → Mamba cross-arch KD** — even without quant, this is research-grade. Quant of Mamba is unproven. Maybe defer.
- **#2 Flux at P0** — image gen is GPU-memory-heavy, and Flux at 12B with 32k context is borderline. Consider smaller image model or shorter context.

These are tactical observations, not quant-specific. But they affect whether the use-case **needs** quant at all.

---

## My overall read

The UR is a reasonable plan-of-record for finetuning on JGS. The QR is a solid inference recipe library. But the **two are misaligned** in scope:

- UR lists 9 finetune use-cases covering many architectures
- QR's JGS scope is **5 models** with full coverage and a few more in progress
- 6 of 9 UR use-cases have **at least one major quant gap**
- 1 of 9 (Mamba) has **zero coverage** in QR

This suggests Team A and Team B need to sync up before committing to the UR as-is. Either:
- (a) Trim UR to align with QR coverage
- (b) Extend QR to cover UR scope
- (c) Compromise — keep UR but document which use-cases are "quant-ready" vs "quant-TBD"

My recommendation would be (c) with explicit owner assignments per gap.