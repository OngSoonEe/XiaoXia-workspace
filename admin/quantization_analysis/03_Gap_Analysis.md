# Gap Analysis: UR vs QR (Quantization Recipe)

## Executive Summary

| Category | Count |
|----------|-------|
| UR Use-Cases | 8 |
| Quantization Required | 4 |
| QR Recipe Available | 5 |
| **Gaps Identified** | **4 use-cases** |

---

## Detailed Gap Matrix

### ✅ No Gap (Covered)

| UC# | Model | Quantization Method | QR Recipe | Status |
|-----|-------|---------------------|-----------|--------|
| UC1 | Llama-3.1-8B | FP16 (baseline) | N/A | No gap - baseline acceptable |
| UC2 | Llama-3.1-8B | MXFP8 | ✅ Llama 3.1 8B MXFP8 | Covered (UC uses INT8 but MXFP8 exists) |
| UC6 | Llama-3.1-70B | MXFP4 | ✅ Llama 3.1 70B MXFP4 | Covered (method unclear but exists) |
| UC8* | Qwen2.5-72B | AWQ MXFP4 | ✅ Qwen-235B AWQ MXFP4 | Covered (similar model exists) |

\* *Qwen2.5-72B recipe not explicitly listed, but Qwen-235B recipe supports AWQ MXFP4*

---

### ❗ HIGH GAP (No QR Coverage - Quantization Required)

| UC# | Model | Quantization Needed | Required Method | QR Coverage | Recommendation |
|-----|-------|---------------------|-----------------|-------------|----------------|
| UC3 | Whisper-large | **Required for high-throughput** | INT8 or FP8 | ❌ None | **ADD RECIPE** |
| UC4 | Qwen2.5-VL-3B | **Required for high-throughput** | INT8 or FP8 | ❌ None | **ADD RECIPE** |
| UC5 | Stable-Diffusion-3.5 | **Required for high-throughput** | FP8 or MXFP8 | ❌ None | **ADD RECIPE** |

#### UC3: Whisper-large Gap Details

**Current UR State**: INT8 quantization suggested, no details

**Required Quantization**:
- Whisper uses Transformer encoder-decoder architecture
- Standard quantization: INT8 PTQ (Post-Training Quantization)
- Alternative: FP8 with dynamic activation scaling
- Framework: vLLM, HuggingFace Transformers, or Whisper-specific tools

**Recommendation**:
1. Use **INT8 PTQ** via HuggingFace Optimum
2. Quantize encoder and decoder separately
3. Keep attention layers in FP16 for numerical stability
4. Expected VRAM: FP16 ~10GB → INT8 ~5GB
5. Accuracy tradeoff: ~1-2% WER increase

**Proposed Recipe Outline**:
```markdown
### Whisper-large Recipe

**Data Type**: INT8 (block-wise)

**Quantization Method**: PTQ (Post-Training Quantization)

**Framework**: HuggingFace Optimum + Intel OpenVINO

**Steps**:
1. Load Whisper-large in FP16
2. Quantize encoder layers: INT8 (block-wise scaling)
3. Quantize decoder layers: INT8 (block-wise scaling)
4. Keep attention softmax in FP32
5. Compile with OpenVINO for JGS

**Exclude Layers**:
- Final decoder projection (keep FP16)

**Tensor-wise vs Block-wise**:
- Linear layers: Block-wise
- Attention scales: Block-wise
- Softmax: FP32 (global scale)
```

---

#### UC4: Qwen2.5-VL-3B Gap Details

**Current UR State**: No quantization specified, FP16 baseline

**Required Quantization**:
- Multimodal model: vision encoder + language model
- **Special handling needed**: vision encoder quantization may require different approach

**Recommended Method**:
- Language model: INT8 or MXFP8
- Vision encoder: FP16 or FP8 (keep higher precision for images)

**Proposed Recipe Outline**:
```markdown
### Qwen2.5-VL-3B Recipe

**Data Type**: Mixed (Language: MXFP8, Vision: FP16)

**Quantization Method**: QAT (Quantization-Aware Training) or PTQ

**Framework**: HuggingFace Optimum + Intel OpenVINO

**Steps**:
1. Load Qwen2.5-VL-3B in FP16
2. Quantize language model: MXFP8 (block-wise)
3. Keep vision encoder: FP16 or convert to FP8
4. Apply PTQ on multimodal dataset

**Exclude Layers**:
- Vision encoder output projection
- Language model final layer

**Tensor-wise vs Block-wise**:
- Language Linear: Block-wise MXFP8
- Vision Linear: Block-wise FP8 or keep FP16
```

---

#### UC5: Stable-Diffusion-3.5 Gap Details

**Current UR State**: No quantization specified, FP16 baseline

**Required Quantization**:
- Diffusion models: Multiple GEMMs per step (UNet + text encoder + VAE)
- **Special handling needed**: Step-wise quantization (not model-level)

**Recommended Method**:
- FP8 with dynamic quantization per layer
- **Not recommended**: Static INT8 (high quality degradation)

**Proposed Recipe Outline**:
```markdown
### Stable-Diffusion-3.5 Recipe

**Data Type**: FP8 (dynamic activation scaling)

**Quantization Method**: QAT (Quantization-Aware Training) with diffusion-specific calibration

**Framework**: Diffusers + Intel OpenVINO

**Steps**:
1. Load SD 3.5 in FP16
2. Quantize UNet layers: FP8 with dynamic scaling
3. Quantize text encoder: MXFP8
4. Keep VAE decoder: FP16 (high precision needed for image reconstruction)
5. Calibrate with diffusion-specific dataset (COCO, LAION)

**Exclude Layers**:
- VAE decoder output layers
- Final output projection

**Tensor-wise vs Block-wise**:
- UNet Linear: Dynamic FP8 (not block-wise due to timestep dependence)
- Text Encoder: Block-wise MXFP8
```

---

### ⚠️ MEDIUM GAP (QR Coverage Partial)

| UC# | Model | Issue | QR Coverage | Recommendation |
|-----|-------|-------|-------------|----------------|
| UC7 | Phi-3.5-mini | No explicit recipe | ❌ None | **ADD RECIPE** |

#### UC7: Phi-3.5-mini Gap Details

**Current UR State**: FP16 baseline, no quantization specified

**Required Quantization**:
- Phi-3.5-mini is a small model (3B parameters)
- **For edge deployment with 4 instances**, consider MXFP8

**Recommendation**:
```markdown
### Phi-3.5-mini Recipe

**Data Type**: MXFP8 (block-wise)

**Quantization Method**: PTQ (Post-Training Quantization)

**Framework**: HuggingFace Optimum + Intel OpenVINO

**Steps**:
1. Load Phi-3.5-mini in FP16
2. Quantize all Linear layers: MXFP8 (block-wise)
3. Keep attention softmax in FP32
4. Compile with OpenVINO

**Exclude Layers**:
- Final decoder projection (keep FP16 for logits)

**Tensor-wise vs Block-wise**:
- All Linear: Block-wise MXFP8
- Attention scales: Block-wise
- Softmax: FP32
```

---

## Cross-Reference with QR

### QR Recipes for Quantization Required Models

| Model | Quantization | QR Recipe | Status |
|-------|-------------|-----------|--------|
| Llama-3.1-8B | MXFP8 | ✅ Section 2.2 | Available |
| Llama-3.1-8B | MXFP4 | ✅ Section 2.2 | Available |
| Llama-3.1-70B | MXFP8 | ✅ Section 2.3 | Available |
| Llama-3.1-70B | NVFP4 | ✅ Section 2.3 | Available |
| Llama-3.1-70B | NVFP4+ | ✅ Section 2.3 | Available |
| Qwen-235B | MXFP8 | ✅ Section 2.6 | Available |
| Qwen-235B | MXFP4 | ✅ Section 2.6 | Available |
| Qwen-235B | NVFP4 | ✅ Section 2.6 | Available |
| **Qwen2.5-72B** | AWQ MXFP4 | ✅ (Qwen-235B) | **Cross-cover** |

### QR Recipes for Non-Required Models

| Model | Quantization | QR Recipe | Status |
|-------|-------------|-----------|--------|
| Whisper-large | INT8/FP8 | ❌ None | **Missing** |
| Qwen2.5-VL-3B | INT8/MXFP8 | ❌ None | **Missing** |
| Stable-Diffusion-3.5 | FP8/MXFP8 | ❌ None | **Missing** |
| Phi-3.5-mini | MXFP8 | ❌ None | **Missing** |

---

## Priority Action Items

| Priority | Use-Case | Action | Effort |
|----------|----------|--------|--------|
| **P1** | UC3 (Whisper) | Add INT8/FP8 recipe | Medium |
| **P1** | UC4 (Qwen2.5-VL) | Add MXFP8/FP8 recipe | Medium |
| **P1** | UC5 (Stable-Diffusion) | Add FP8 recipe | High |
| **P2** | UC7 (Phi-3.5) | Add MXFP8 recipe | Low |
| **P2** | UC2 | Update INT8 → MXFP8 | Low |
| **P2** | UC6 | Clarify INT4_GEQ → MXFP4 | Low |

---

## Final Verification Checklist

- [x] UC1 (Llama-3.1-8B FP16): Baseline acceptable
- [x] UC2 (Llama-3.1-8B): **Update INT8 → MXFP8**
- [ ] UC3 (Whisper-large): **ADD RECIPE - HIGH PRIORITY**
- [ ] UC4 (Qwen2.5-VL): **ADD RECIPE - HIGH PRIORITY**
- [ ] UC5 (Stable-Diffusion): **ADD RECIPE - HIGH PRIORITY**
- [x] UC6 (Llama-3.1-70B): MXFP4 recipe exists
- [ ] UC7 (Phi-3.5): **ADD RECIPE - LOW PRIORITY**
- [x] UC8 (Qwen2.5-72B): Cross-cover via Qwen-235B
