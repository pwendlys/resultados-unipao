

## Fix: Treasurer Signature Image Not Rendering in ATA PDF

### Root Cause

The `renderSignature` function in `meetingMinutesPdfGenerator.ts` hardcodes `'PNG'` as the image format for `doc.addImage()`. If the treasurer's signature payload has a slightly different encoding or if jsPDF silently fails for certain base64 strings, the image won't render but no error is thrown (the catch block never fires).

Additionally, the current `normalizeSignatureData` doesn't log anything, making it impossible to diagnose whether the payload is valid.

### Fix

**File: `src/utils/meetingMinutesPdfGenerator.ts`**

1. Improve `normalizeSignatureData` to:
   - Log payload length and prefix for debugging
   - Handle edge cases: empty string, whitespace-only, very short payloads
   - Strip any accidental double `data:image` prefix

2. Improve `renderSignature` to:
   - Detect image type from the data URL (`PNG` vs `JPEG`) instead of hardcoding `'PNG'`
   - Log before `addImage` call: payload length, detected type
   - Use larger dimensions (120x50 instead of 80x35) for better visibility
   - Add explicit fallback text if payload is present but `addImage` silently fails (render a "signature registered" note)

### Specific Changes

```typescript
// normalizeSignatureData — enhanced
const normalizeSignatureData = (payload: string): string => {
  if (!payload || !payload.trim()) {
    console.warn('[MeetingMinutesPDF] Empty signature payload');
    return '';
  }
  const trimmed = payload.trim();
  // Already a proper data URL
  if (trimmed.startsWith('data:image/')) return trimmed;
  // Raw base64 — add PNG prefix
  console.log('[MeetingMinutesPDF] Adding data:image prefix to raw base64');
  return `data:image/png;base64,${trimmed}`;
};

// Detect format for addImage
const getImageFormat = (dataUrl: string): string => {
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) return 'JPEG';
  return 'PNG';
};

// In renderSignature — replace the addImage block:
if (sig.signaturePayload) {
  const normalizedPayload = normalizeSignatureData(sig.signaturePayload);
  console.log(`[MeetingMinutesPDF] Rendering signature for ${sig.displayName} (${sig.role}), payload length: ${normalizedPayload.length}`);
  if (normalizedPayload && normalizedPayload.length > 100) {
    const imgFormat = getImageFormat(normalizedPayload);
    doc.addImage(normalizedPayload, imgFormat, margin, yPos, 120, 50);
    yPos += 53;
  } else {
    doc.text('[Assinatura registrada no sistema]', margin, yPos);
    yPos += 8;
  }
}
```

### Files Modified

| File | Change |
|------|--------|
| `meetingMinutesPdfGenerator.ts` | Enhanced normalization, auto-detect image format, larger dimensions, debug logging |

### What Will NOT Change
- No changes to signature collection (TreasurerSignatureModal, FiscalSignatureModal)
- No changes to the resolver (`meetingSignatureResolver.ts`)
- No database changes
- No changes to the fiscal reports module

