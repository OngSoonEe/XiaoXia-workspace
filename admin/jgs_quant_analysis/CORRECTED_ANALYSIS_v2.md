# Corrected JGS Quantization Analysis (v2 - Fixed)

**Date:** 2026-05-03  
**Author:** OpenClaw Analysis (with corrections per user feedback)

---

## Executive Summary

**Correction:** My original analysis incorrectly claimed "JGS uses NVFP4, not MXFP4" as a binary choice. The truth is more nuanced.

The QR document (v0.9.4) shows:
- **CRI** has MXFP4 as its 4-bit format (recommended)
- **JGS** has NVFP4 as its 4-bit format (recommended)
- BUT DeepSeek R1 (in the DeepSeek R1 section) has BOTH MXFP4 and NVFP4 recipes
- The DeepSeek R1 MXFP4 recipe uses **AutoRound** (not RTN)

The key distinction is:
1. **DeepSeek R1 MXFP8 + KV/Attn FP8** - This is the CRI recipe (has AutoRound MXFP4)
2. **DeepSeek R1 NVFP4 + FP32 global scale** - This is the JGS recipe

---

## QR Document Structure Reference

### Table 1: Recommended Data Types

| Target | 4-bit Format | 8-bit Format |
|--------|-------------|--------------|
| **CRI** | MXFP4 (E2M1, E8M0, block 32) | MXFP8 (E4M3, E8M0, block 32) |
| **JGS** | NVFP4 (E2M1, UE4M3, block 16 + FP32 global scale) | MXFP8 (E4M3, E8M0, block 32) |

### Table 2: CRI Key Models

| Model | MXFP8 | MXFP4 |
|-------|-------|-------|
| DeepSeek-R1 | ✓ | ✓ |
| Llama 3.3 70B | ✓ | ✓ |
| Llama 3.1 8B | ✓ | ✓ |
| Qwen-235B | ✓ | ✓ |

### Table 3: JGS Key Models

| Model | MXFP8 | NVFP4 |
|-------|-------|-------|
| Llama 3.1 70B | ✓ | ✓ |
| DeepSeek-R1 | ✓ | ✓ |
| Llama4 Maverick | N/A (native FP8) | WIP |
| Flux | ✓ | Not started |
| DLRM | WIP | WIP |

---

## DeepSeek R1 Recipe Breakdown (Tables 17-21)

### Table 19: DeepSeek R1 MXFP8 (CRI Recipe)
```
Linear: MXFP8, E4M3, block 32, E8M0 scale
KV Cache: FP8, E4M3, per-tensor
Attention: FP8, E4M3, per-tensor
Exclude: lm-head, mlp.gate
Quant algo: RTN
```

### Table 20: DeepSeek R1 MXFP4 (CRI Recipe with AutoRound)
```
Linear: MXFP4, E2M1, block 32, E8M0 scale
KV Cache: FP8, E4M3, per-tensor
Attention: FP8, E4M3, per-tensor
Exclude: lm_head, all attention Linears, mlp.gate
Quant algo: AutoRound Tuning
```

### Table 21: DeepSeek R1 NVFP4 (JGS Recipe)
```
Linear: NVFP4, E2M1, block 16, UE4M3 scale + FP32 global scale
Quant algo: RTN
```

### Table 17: DeepSeek R1 Accuracy (shows all three work)
```
MXFP8(Intel): 0.9591 Gsm8k, 0.8513 Mmlu
MXFP4(Intel): 0.9560 Gsm8k, 0.8480 Mmlu
NVFP4(Intel): 0.9545 Gsm8k, 0.8472 Mmlu
```

---

## Correction of Original Analysis

### What I Got Wrong

**Claim:** "MXFP4 is not native to JGS"  
**Correction:** The QR document **does** include MXFP4 for DeepSeek R1, but this is the **CRI recipe** (with AutoRound). The JGS recipe for DeepSeek R1 uses **NVFP4**.

**Claim:** "UR is wrong for using MXFP4"  
**Correction:** The UR's use of "TorchAO (quant optional)" without specifying format is the issue. The actual JGS recipes in QR are:
- MXFP8 for 8-bit (same for both CRI and JGS)
- NVFP4 for 4-bit (JGS)
- MXFP4 for 4-bit (CRI only, not JGS)

---

## Corrected Gap Analysis

### Use-Cases Needing Quantization (JGS)

| Use-Case | Required Quantization | JGS Covered | Notes |
|----------|----------------------|-------------|-------|
| **Llama 3.1 70B** | MXFP8 + NVFP4 | ✓ | Both recipes exist |
| **DeepSeek R1** | MXFP8 + NVFP4 | ✓ | JGS NVFP4 recipe exists |
| **Llama4 Maverick** | FP8 + NVFP4 | FP8 ✓, NVFP4 WIP | NVFP4 not ready |
| **Flux** | MXFP8 | ✓ | NVFP4 not started (may not be needed) |
| **DLRM** | MXFP8 + NVFP4 | Both WIP | Recipes not ready |

### Key Differences Between CRI and JGS Recipes

| Model | CRI 4-bit | JGS 4-bit | CRI 8-bit | JGS 8-bit |
|-------|-----------|-----------|-----------|-----------|
| DeepSeek R1 | MXFP4 | NVFP4 | MXFP8 | MXFP8 |
| Llama 3.1 70B | N/A (CRI doesn't list it) | NVFP4 | MXFP8 | MXFP8 |
| Llama 3.3 70B | MXFP4 | N/A | MXFP8 | MXFP8 |

### The Real Gap

The **only gap** for JGS is:
1. **Llama4 Maverick NVFP4** - WIP
2. **Flux NVFP4** - Not started (but MXFP8 is available)
3. **DLRM** - Both recipes WIP

There is **NO gap** for DeepSeek R1 - it has MXFP8 and NVFP4 recipes for JGS.

---

## References (from QR Document v0.9.4)

### Table References
- **Table 1** (Page 8): Recommended data types for CRI/JGS key models
- **Table 2** (Page 9): CRI Key Models with MXFP4 recipes
- **Table 3** (Page 9): JGS Key Models with NVFP4 recipes

### Section References
- **Section 2.2** (Page 10): Llama 3.1 8B - MXFP8, MXFP4 recipes
- **Section 2.3** (Page 12): Llama 3.1 70B - MXFP8, NVFP4, NVFP4+ recipes
- **Section 2.4** (Page 13): Llama 3.3 70B - MXFP8, MXFP4 recipes
- **Section 2.5** (Page 15): DeepSeek R1 - MXFP8, MXFP4, NVFP4 recipes
  - 2.5.1 MXFP8 recipe (Table 19)
  - 2.5.2 MXFP4 recipe (Table 20)
  - 2.5.3 NVFP4 recipe (Table 21)
  - 2.5.4 Accuracy Result (Table 17)
- **Section 2.8** (Page 21): Llama4 Maverick - FP8, NVFP4 recipes
- **Section 2.10** (Page 24): DLRM - FP8, NVFP4 recipes
- **Section 2.11** (Page 25): Flux - FP8, MXFP8 recipes

### Section 4 - Low Precision Finetuning (Page 34)
- 4.2.1.1 SFT MXFP8 (Page 35)
- 4.2.1.3 SFT MXFP4 (Page 37)
- 4.3.1.1 SFT (Page 37)

### From QR Document

**Table 1 (Page 8):**
```
CRI: Best 4-bit = MXFP4 (E2M1, E8M0)
CRI: Best 8-bit = MXFP8 (E4M3, E8M0)
JGS: Best 4-bit = NVFP4 (E2M1, UE4M3, block 16 + FP32 global)
JGS: Best 8-bit = MXFP8 (E4M3, E8M0)
```

**Table 2 (CRI Key Models):** Shows MXFP4 recipes for DeepSeek R1, Llama 3.3 70B, etc.

**Table 3 (JGS Key Models):** Shows NVFP4 recipes for Llama 3.1 70B, DeepSeek R1, Flux (not started), DLRM (WIP)

**DeepSeek R1 Section (Tables 17-21):**
- Table 19: MXFP8 recipe (RTN, KV/Attn FP8)
- Table 20: MXFP4 recipe (AutoRound, KV/Attn FP8) - CRI recipe
- Table 21: NVFP4 recipe (RTN, no KV/Attn) - JGS recipe
- Table 17: Accuracy results showing all three work

---

## Final Summary

The QR document correctly distinguishes:
- **CRI 4-bit:** MXFP4
- **JGS 4-bit:** NVFP4
- **Both CRI and JGS 8-bit:** MXFP8

My original analysis incorrectly assumed JGS doesn't support MXFP4 at all. The reality is:
1. DeepSeek R1 has BOTH MXFP4 and NVFP4 recipes in the QR
2. The MXFP4 recipe for DeepSeek R1 uses AutoRound (CRI's recommended approach)
3. The JGS recipe for DeepSeek R1 uses NVFP4 (RTN, with FP32 global scale)

The actual JGS gap is smaller than I initially reported. The key issues are:
- Llama4 Maverick NVFP4 not ready
- Flux NVFP4 not started (but may not be needed)
- DLRM recipes WIP