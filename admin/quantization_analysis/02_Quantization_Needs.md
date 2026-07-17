# Quantization Needs Analysis

## Methodology
Only use-cases where quantization is **genuinely required** (for hardware constraints, memory limits, or performance optimization) should be identified. Baseline FP16/BF16 deployments are acceptable if:
- Model fits in GPU memory without quantization
- Performance meets SLA without quantization
- No hardware-specific quantization required

---

## Use-Case by Use-Case Assessment

### UC1: Llama-3.1-8B Chatbot (2 instances, FP16, 75W)
**Assessment**: ✅ **No quantization needed**
- Llama-3.1-8B FP16 requires ~15GB VRAM
- JGS-D with 160GB vRAM can easily accommodate 2 instances
- FP16 provides highest accuracy for chatbot scenarios
- MXFP8/MXFP4 would be **optional optimization** but not required

**Recommendation**: Keep FP16 as baseline. Consider MXFP8 for performance boost if latency SLA requires it.

---

### UC2: Llama-3.1-8B Chatbot (2 instances, INT8, 75W)
**Assessment**: ⚠️ **Quantization questionable**
- INT8 quantization reduces VRAM from ~15GB to ~8GB
- JGS-D has 160GB vRAM - no memory constraint
- INT8 introduces ~1-2% accuracy drop vs FP16
- **Better alternative**: MXFP8 (native JGS format, ~1% accuracy drop, same VRAM savings)

**Recommendation**: Replace INT8 with **MXFP8** per QR recommendations.

---

### UC3: Whisper-large ASR (2 instances, FP16, 75W)
**Assessment**: ❌ **Critical gap - no quantization coverage**
- Whisper-large requires ~10GB VRAM for FP16
- JGS-D can handle 2 instances without quantization
- **However**: No QR recipe exists for Whisper models
- Quantization methods for Whisper are less standardized than LLMs

**Recommendation**: 
- **Option A**: Keep FP16 baseline (acceptable given memory headroom)
- **Option B**: If quantization required, use generic FP16→INT8 conversion with vLLM or HuggingFace, but expect accuracy tradeoffs

---

### UC4: Qwen2.5-VL-3B Visual Q&A (2 instances, FP16, 75W)
**Assessment**: ❌ **Critical gap - no quantization coverage**
- Qwen2.5-VL-3B multimodal model
- **No QR recipe exists for VLM variants**
- Multimodal quantization requires special handling (vision encoder + language model)

**Recommendation**:
- **Option A**: Keep FP16 baseline (3B model fits in 6-8GB VRAM)
- **Option B**: If quantization needed, use generic PTQ with INT8, but validate multimodal accuracy

---

### UC5: Stable-Diffusion-3.5 Text-to-Image (1 instance, FP16, 75W)
**Assessment**: ❌ **Critical gap - no quantization coverage**
- Stable Diffusion 3.5 is a diffusion model (not LLM)
- **No QR recipe exists for Stable Diffusion 3.5**
- Diffusion models have different quantization challenges (multiple GEMMs per step)

**Recommendation**:
- **Option A**: Keep FP16 baseline (diffusion models need high numerical precision)
- **Option B**: If quantization required, use FP8 with dynamic quantization per layer, but expect quality degradation

---

### UC6: Llama-3.1-70B Chatbot (1 instance, INT4_GEQ, 75W)
**Assessment**: ⚠️ **Quantization required, but method needs clarification**
- Llama-3.1-70B FP16 requires ~140GB VRAM
- JGS-D has 160GB vRAM - **bare minimum**, no room for optimization
- **INT4_GEQ is ambiguous** - should be explicit about quantization method

**Recommendation**: Use **MXFP4** per QR recommendations for 70B models.

---

### UC7: Phi-3.5-mini SLM (4 instances, FP16, 75W)
**Assessment**: ⚠️ **Quantization probably needed for scalability**
- Phi-3.5-mini is a small model (~3B parameters)
- 4 instances at FP16 requires ~12GB VRAM - easily within 160GB
- **However**: "Edge SLM Chatbot" suggests high-concurrency deployment
- For high concurrency, quantization improves instance density

**Recommendation**: If high instance density needed, use **MXFP8**. If simple deployment, keep FP16.

---

### UC8: Qwen2.5-72B Chatbot (1 instance, INT4_AWQ, 75W)
**Assessment**: ⚠️ **Quantization required, but method unclear**
- Qwen2.5-72B FP16 requires ~144GB VRAM
- JGS-D has 160GB - tight fit, quantization needed
- INT4_AWQ implies AWQ quantization algorithm

**Recommendation**: **Cross-check QR for Qwen-235B recipe** - if AWQ MXFP4 works for 235B, likely works for 72B too.

---

## Summary: Quantization Requirements Matrix

| UC# | Use-Case | Quantization Required? | Recommended Method | Notes |
|-----|----------|------------------------|-------------------|-------|
| UC1 | Llama-3.1-8B Chatbot | ❌ Optional | MXFP8 (if performance needed) | FP16 baseline acceptable |
| UC2 | Llama-3.1-8B Chatbot (quantized) | ⚠️ Yes | **MXFP8** (not INT8) | Current INT8 suboptimal for JGS |
| UC3 | Whisper-large ASR | ❌ Not required | N/A (no QR recipe) | Keep FP16 or generic INT8 |
| UC4 | Qwen2.5-VL-3B VQA | ❌ Not required | N/A (no QR recipe) | Keep FP16 or generic INT8 |
| UC5 | Stable-Diffusion-3.5 | ❌ Not required | N/A (no QR recipe) | Keep FP16 or FP8 with caution |
| UC6 | Llama-3.1-70B Chatbot | ✅ Required | **MXFP4** | Current INT4_GEQ ambiguous |
| UC7 | Phi-3.5-mini Edge SLM | ⚠️ For scalability | **MXFP8** | FP16 acceptable for low concurrency |
| UC8 | Qwen2.5-72B Chatbot | ✅ Required | **AWQ MXFP4** or **INT4** | Verify compatibility with Qwen-235B |

---

## Key Findings

1. **Only 2 use-cases truly require quantization** (UC6, UC8) due to VRAM constraints
2. **2 use-cases use suboptimal quantization methods** (UC2 INT8 should be MXFP8)
3. **4 use-cases have no QR coverage** (UC3, UC4, UC5, UC7)
4. **No KV cache quantization** mentioned for large LLMs (critical for 70B/72B)

---

## Gaps vs. QR Coverage

| Use-Case | Model | Quantization Needed | QR Recipe Exists? | Gap |
|----------|-------|---------------------|-------------------|-----|
| UC1 | Llama-3.1-8B | Optional (MXFP8) | ✅ Yes | None |
| UC2 | Llama-3.1-8B | Required (MXFP8) | ✅ Yes | No gap (but UC uses INT8) |
| UC3 | Whisper-large | Optional | ❌ No | **HIGH GAP** |
| UC4 | Qwen2.5-VL-3B | Optional | ❌ No | **HIGH GAP** |
| UC5 | Stable-Diffusion-3.5 | Optional | ❌ No | **HIGH GAP** |
| UC6 | Llama-3.1-70B | Required (MXFP4) | ✅ Yes | No gap (but method unclear) |
| UC7 | Phi-3.5-mini | Optional (MXFP8) | ❌ No | **MEDIUM GAP** |
| UC8 | Qwen2.5-72B | Required (INT4/AWQ) | ❌ No (Qwen-235B exists) | **MEDIUM GAP** |
