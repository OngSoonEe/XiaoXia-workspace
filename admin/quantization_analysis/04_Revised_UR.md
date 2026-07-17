# Gap-Corrected UR (Use-Case Recipe)

## Document: Revised Quantization Requirements for Intel JaguarShore

**Author**: Independent Analysis  
**Date**: 2026-05-02  
**Target Device**: JGS-D (160GB vRAM, 75W TDP)

---

## Executive Summary

Original UR listed 8 use-cases. After analysis:
- **4 use-cases**: Already covered by QR (no action needed)
- **2 use-cases**: Require method correction (INT8 → MXFP8, INT4_GEQ → MXFP4)
- **4 use-cases**: Require new QR recipes (Whisper, Qwen2.5-VL, Stable-Diffusion, Phi-3.5)

---

## Revised Use-Case Table

| UC# | Model | Category | Precision | Instance | Device | TDP | Status |
|-----|-------|----------|-----------|----------|--------|-----|--------|
| UC1 | Llama-3.1-8B | LLM | **FP16** | 2 | JGS-D | 75 | ✅ Baseline OK |
| UC2 | Llama-3.1-8B | LLM | **MXFP8** | 2 | JGS-D | 75 | ✅ Updated |
| UC3 | Whisper-large | ASR | **INT8** | 2 | JGS-D | 75 | ⚠️ New recipe needed |
| UC4 | Qwen2.5-VL-3B | VLM | **MXFP8** | 2 | JGS-D | 75 | ⚠️ New recipe needed |
| UC5 | Stable-Diffusion-3.5 | Image Gen | **FP8** | 1 | JGS-D | 75 | ⚠️ New recipe needed |
| UC6 | Llama-3.1-70B | LLM | **MXFP4** | 1 | JGS-D | 75 | ✅ Updated |
| UC7 | Phi-3.5-mini | SLM | **MXFP8** | 4 | JGS-D | 75 | ⚠️ New recipe needed |
| UC8 | Qwen2.5-72B | LLM | **AWQ MXFP4** | 1 | JGS-D | 75 | ✅ Cross-cover |

---

## Detailed Use-Cases with Quantization Recipes

### UC1: Llama-3.1-8B Chatbot (2 instances)

**Use-Case**: General-purpose chatbot

**Quantization Method**: **FP16 baseline** (no quantization needed)

**Rationale**:
- Llama-3.1-8B FP16 requires ~15GB VRAM
- JGS-D has 160GB vRAM - ample headroom
- FP16 provides highest accuracy
- MXFP8 is optional optimization for latency

**Performance**:
- VRAM: ~15GB per instance
- Throughput: High (no quantization overhead)

**Reference**: N/A (baseline)

---

### UC2: Llama-3.1-8B Chatbot (Quantized, 2 instances)

**Use-Case**: High-throughput chatbot with optimized VRAM

**Quantization Method**: **MXFP8** (not INT8)

**Data Type**: Matrix NF8 (block-wise scaling)

**Framework**: vLLM + Intel OpenVINO

**Configuration**:
```yaml
quantization:
  method: mxfp8
  weight_scaling: block
  activation_scaling: dynamic
  exclude_layers:
    - final_logits
```

**Performance**:
- VRAM: ~8GB per instance (45% reduction)
- Accuracy: <1% vs FP16 (per QR)
- Throughput: Higher than INT8 (native JGS support)

**Reference**: QR Section 2.2 - Llama 3.1 8B MXFP8 Recipe

---

### UC3: Whisper-large ASR (2 instances)

**Use-Case**: Speech-to-text transcription service

**Quantization Method**: **INT8** (PTQ)

**Data Type**: INT8 (block-wise)

**Framework**: HuggingFace Optimum + Intel OpenVINO

**Configuration**:
```yaml
quantization:
  method: ptq
  precision: int8
  weight_scaling: block
  activation_scaling: dynamic
  exclude_layers:
    - encoder_proj
    - decoder_output
```

**Steps**:
1. Load Whisper-large in FP16
2. Apply PTQ with INT8 calibration dataset
3. Quantize encoder and decoder separately
4. Compile with OpenVINO for JGS

**Performance**:
- VRAM: ~5GB per instance (50% reduction)
- Accuracy: ~1-2% WER increase expected
- Latency: ~20-30% improvement

**New Recipe Required**: See Gap Analysis Section 1

---

### UC4: Qwen2.5-VL-3B Visual Q&A (2 instances)

**Use-Case**: Multimodal visual question answering

**Quantization Method**: **Mixed MXFP8 + FP16**

**Data Type**: Language model - MXFP8, Vision encoder - FP16

**Framework**: HuggingFace Optimum + Intel OpenVINO

**Configuration**:
```yaml
quantization:
  method: ptq
  mixed_precision: true
  language_model:
    precision: mxfp8
    weight_scaling: block
  vision_encoder:
    precision: fp16
```

**Steps**:
1. Load Qwen2.5-VL-3B in FP16
2. Quantize language model: MXFP8
3. Keep vision encoder: FP16 (critical for image quality)
4. Calibrate with multimodal dataset

**Performance**:
- VRAM: ~8GB per instance
- Accuracy: Vision quality preserved
- Throughput: ~2x improvement

**New Recipe Required**: See Gap Analysis Section 2

---

### UC5: Stable-Diffusion-3.5 Text-to-Image (1 instance)

**Use-Case**: High-quality text-to-image generation

**Quantization Method**: **FP8 with dynamic scaling**

**Data Type**: FP8 (dynamic activation scaling per layer)

**Framework**: Diffusers + Intel OpenVINO

**Configuration**:
```yaml
quantization:
  method: qat
  precision: fp8
  dynamic_scaling: true
  exclude_layers:
    - vae_decoder
    - final_projection
```

**Steps**:
1. Load SD 3.5 in FP16
2. Apply QAT with FP8 calibration
3. Keep VAE decoder: FP16 (high precision needed)
4. Compile with OpenVINO

**Performance**:
- VRAM: ~20GB (vs ~40GB FP16)
- Quality: Expected ~3-5% degradation
- Latency: ~2x improvement

**New Recipe Required**: See Gap Analysis Section 3

---

### UC6: Llama-3.1-70B Chatbot (1 instance)

**Use-Case**: Large LLM chatbot with constrained VRAM

**Quantization Method**: **MXFP4**

**Data Type**: Matrix NF4 (block-wise scaling)

**Framework**: vLLM + Intel OpenVINO

**Configuration**:
```yaml
quantization:
  method: mxfp4
  weight_scaling: block
  kv_cache_quant: true
  exclude_layers:
    - final_logits
```

**Performance**:
- VRAM: ~70GB (vs ~140GB FP16)
- Accuracy: <2% vs FP16 (per QR)
- Throughput: ~3x improvement

**Reference**: QR Section 2.3 - Llama 3.1 70B MXFP4 Recipe

---

### UC7: Phi-3.5-mini Edge SLM (4 instances)

**Use-Case**: Edge device small language model deployment

**Quantization Method**: **MXFP8**

**Data Type**: Matrix NF8 (block-wise scaling)

**Framework**: HuggingFace Optimum + Intel OpenVINO

**Configuration**:
```yaml
quantization:
  method: mxfp8
  weight_scaling: block
  exclude_layers:
    - final_logits
```

**Performance**:
- VRAM: ~1GB per instance (vs ~3GB FP16)
- Accuracy: <1% vs FP16
- Instance density: 4x improvement

**New Recipe Required**: See Gap Analysis Section 4

---

### UC8: Qwen2.5-72B Chatbot (1 instance)

**Use-Case**: Large LLM chatbot with AWQ quantization

**Quantization Method**: **AWQ MXFP4**

**Data Type**: AWQ quantized weights + MXFP4 scaling

**Framework**: AutoAWQ + vLLM + Intel OpenVINO

**Configuration**:
```yaml
quantization:
  method: awq
  precision: mxfp4
  weight_scaling: block
  kv_cache_quant: true
```

**Performance**:
- VRAM: ~35GB (vs ~144GB FP16)
- Accuracy: <1% vs FP16
- Throughput: ~4x improvement

**Cross-Cover**: Qwen-235B recipe applies (Qwen2.5-72B smaller, same method)

**Reference**: QR Section 2.6 - Qwen-235B AWQ MXFP4 Recipe

---

## Summary of Changes

| Original UC | Original Method | Revised Method | Rationale |
|-------------|-----------------|----------------|-----------|
| UC2 | INT8 | **MXFP8** | JGS hardware acceleration, same VRAM savings |
| UC6 | INT4_GEQ (ambiguous) | **MXFP4** | Standard JGS format, explicit recipe |
| UC7 | FP16 | **MXFP8** | High instance count requires quantization |

---

## New Recipes Required

| Use-Case | Model | Quantization Method | Priority |
|----------|-------|---------------------|----------|
| UC3 | Whisper-large | INT8 PTQ | High |
| UC4 | Qwen2.5-VL-3B | MXFP8 + FP16 mixed | High |
| UC5 | Stable-Diffusion-3.5 | FP8 QAT | High |
| UC7 | Phi-3.5-mini | MXFP8 | Low |

---

## Final Verification Checklist

- [x] UC1 (Llama-3.1-8B): FP16 baseline OK
- [x] UC2 (Llama-3.1-8B): MXFP8 (updated from INT8)
- [x] UC3 (Whisper): New INT8 recipe required
- [x] UC4 (Qwen2.5-VL): New mixed recipe required
- [x] UC5 (Stable-Diffusion): New FP8 recipe required
- [x] UC6 (Llama-3.1-70B): MXFP4 (updated from INT4_GEQ)
- [x] UC7 (Phi-3.5): New MXFP8 recipe required
- [x] UC8 (Qwen2.5-72B): AWQ MXFP4 (cross-cover via Qwen-235B)

---

## Deliverables for Jack

1. ✅ This document (gap-corrected UR)
2. ⏳ Updated QR with Whisper, Qwen2.5-VL, Stable-Diffusion, Phi-3.5 recipes
3. ⏳ Gap analysis document (detailed methodology)
4. ⏳ Original UR analysis (issues identified)

**Note**: The QR team should prioritize adding recipes for:
1. Whisper (ASR use-case)
2. Qwen2.5-VL (multimodal use-case)
3. Stable-Diffusion (diffusion model use-case)
