# UR (Use-Case Recipe) Analysis - Intel JaguarShore

## Intel JaguarShore Platform Context

Based on the documents, JaguarShore (JGS) is Intel's inference-optimized GPU platform with support for:
- **Data Types**: MXFP8, MXFP4, NVFP4, NVFP4+, INT8, INT4, BF16, FP16
- **Architecture**: Xe3P cores with high bandwidth memory
- **Target**: Enterprise AI workloads with 160GB vRAM (JGS-D model)
- **TDP**: 75W per JGS-D device

---

## UR Use-Cases Inventory

| UC# | Model | Category | Precision | Instance | Device | TDP | Notes |
|-----|-------|----------|-----------|----------|--------|-----|-------|
| UC1 | Llama-3.1-8B | LLM | FP16 | 2 | JGS-D | 75 | Chatbot (baseline FP16) |
| UC2 | Llama-3.1-8B | LLM | INT8 | 2 | JGS-D | 75 | Chatbot (quantized INT8) |
| UC3 | Whisper-large | ASR | FP16 | 2 | JGS-D | 75 | Speech-to-Text |
| UC4 | Qwen2.5-VL-3B | VLM | FP16 | 2 | JGS-D | 75 | Visual Q&A |
| UC5 | Stable-Diffusion-3.5 | Image Gen | FP16 | 1 | JGS-D | 75 | Text-to-Image |
| UC6 | Llama-3.1-70B | LLM | INT4_GEQ | 1 | JGS-D | 75 | Chatbot (GPTQ, INT4) |
| UC7 | Phi-3.5-mini | SLM | FP16 | 4 | JGS-D | 75 | Edge SLM Chatbot |
| UC8 | Qwen2.5-72B | LLM | INT4_AWQ | 1 | JGS-D | 75 | Chatbot (AWQ, INT4) |

---

## Initial Issues & Concerns

### 1. **Precision Labels Ambiguity**
- **UC6 uses `INT4_GEQ`**: This appears to be a typo/misnomer. Standard quantization formats are:
  - INT4 (4-bit integer)
  - GPTQ (a quantization algorithm that typically uses INT4 weights)
  - AWQ (Activation-aware Weight Quantization, typically INT4)
  
  The label `INT4_GEQ` (presumably "INT4 or greater") is vague and inconsistent with standard terminology. If it means "INT4 via GPTQ", it should be labeled as such.

- **UC8 uses `INT4_AWQ`**: This is clearer - AWQ is a specific quantization method resulting in INT4 weights.

### 2. **Missing Context for Quantization Methods**
- UC2 (INT8) and UC7 (FP16 for Phi-3.5-mini) don't specify whether these are baseline or quantized modes
- No mention of quantization frameworks: **GPTQ, AWQ, AutoGPTQ, llama.cpp, vLLM, OpenVINO, etc.**

### 3. **Platform-Specific Considerations**
- **JGS-D** appears to be a discrete GPU card (75W TDP)
- Intel JGS supports **MXFP8/MXFP4/NVFP4** natively - these are the recommended formats per QR
- Using **INT8/INT4** instead of MXFP4/NVFP4 may not be optimal for JGS hardware

### 4. **Model Coverage Gaps**
- **Whisper-large (UC3)**: No QR recipe found for Whisper in QR docx
- **Qwen2.5-VL-3B (UC4)**: No QR recipe found for Qwen2.5-VL
- **Stable-Diffusion-3.5 (UC5)**: No QR recipe found for Stable Diffusion 3.5
- **Phi-3.5-mini (UC7)**: No QR recipe found for Phi-3.5-mini

### 5. **Scalability & Deployment Questions**
- **Instance count (2)** for UC1/UC2/UC3/UC4 - are these for parallel serving or model parallelism?
- **4 instances for Phi-3.5-mini (UC7)** - what's the rationale? Edge deployment implies single-inference-unit scaling
- No mention of **KV cache quantization**, which is critical for large LLMs

---

## Research Findings

### Intel JGS Data Type Support (from QR)
| Data Type | Description | Device |
|-----------|-------------|--------|
| **MXFP8** | Matrix NF8 (block-wise scaling) | JGS/CRI |
| **MXFP4** | Matrix NF4 (block-wise scaling) | JGS/CRI |
| **NVFP4** | NVIDIA FP4 (block-wise scaling) | CRI only |
| **NVFP4+** | NVFP4 with global scale | CRI only |
| **INT4/INT8** | Standard integer quantization | Both |
| **FP16/BF16** | Floating point | Both |

### Quantization Recipe Readiness (from QR)
- **Llama 3.1 8B**: MXFP8 ✓, MXFP4 ✓
- **Llama 3.1 70B**: MXFP8 ✓, NVFP4 ✓, NVFP4+ ✓
- **Llama 3.3 70B**: MXFP8 ✓, MXFP4 ✓
- **DeepSeek R1**: MXFP8 ✓, MXFP4 ✓, NVFP4 ✓
- **Qwen-235B**: MXFP8 ✓, MXFP4 ✓, NVFP4 ✓
- **GPT-OSS 120B**: MXFP4 ✓
- **Llama4 Maverick**: FP8 ✓, NVFP4 ✓
- **Llama4 Scout**: MXFP4 ✓
- **Flux**: FP8 ✓, MXFP8 ✓

**Note**: The QR clearly states MXFP8 and MXFP4 are recommended for **both JGS and CRI**, while NVFP4/NVFP4+ are **CRI-only**.

---

## Critical Observations

1. **UC1 (Llama-3.1-8B FP16)** is marked as "baseline" but no MXFP8/MXFP4 recipe is provided in UR - this should use MXFP8 per QR
2. **UC2 (Llama-3.1-8B INT8)** should be MXFP8 (not INT8) to leverage JGS hardware acceleration
3. **UC6 (Llama-3.1-70B INT4_GEQ)** should specify "GPTQ INT4" or use MXFP4 per QR
4. **UC7 (Phi-3.5-mini FP16)** - no QR recipe exists; should verify if Phi-3.5-mini has official quantized versions
5. **UC8 (Qwen2.5-72B INT4_AWQ)** - no QR recipe exists for Qwen-235B, so Qwen2.5-72B may need custom recipe

---

## Summary of Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| UC2 uses INT8 instead of MXFP8 | HIGH | JGS hardware acceleration optimized for MX formats |
| UC6 precision label `INT4_GEQ` | MEDIUM | Non-standard terminology; should specify GPTQ or use MXFP4 |
| Missing Whisper-large recipe | HIGH | No QR coverage for Whisper models |
| Missing Qwen2.5-VL-3B recipe | HIGH | No QR coverage for VLM variants |
| Missing Stable-Diffusion-3.5 recipe | HIGH | No QR coverage for SD 3.5 |
| Missing Phi-3.5-mini recipe | HIGH | No QR coverage for Phi-3.5 |
| No KV cache quantization mentioned | MEDIUM | Critical for large LLM inference efficiency |
| Ambiguous instance counts | LOW | No justification for parallel vs. single-instance deployments |
