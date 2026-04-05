

## Fix: Treasurer Signature Not Rendering in ATA PDF

### Root Cause

Arthur signed ~12 reports in rapid succession on 2026-04-02 (within 40 seconds). Most of these produced **blank canvas exports** (2118 chars = a transparent 400x200 PNG). The `resolveSignatures` function picks the first match ordered by `signed_at DESC`, which is always one of these blank signatures.

The signature data is technically valid `data:image/png;base64,...` but contains no visible strokes — just a transparent canvas. jsPDF renders it, but nothing is visible.

### Solution

Modify `resolveSignatures` in `meetingSignatureResolver.ts` to **prefer the largest signature payload** for each user across the selected reports, instead of just the most recent. A larger payload means more actual drawing content.

### Changes

**File: `src/utils/meetingSignatureResolver.ts`**

Replace the `.find()` calls with logic that picks the signature with the **longest `signature_data`** for each user:

1. For treasurer lookup in `treasurer_signatures`: instead of `safeTreasurerSigs.find(s => s.user_id === id)` (which returns the first = most recent), filter all matches for that user and pick the one with `max(signature_data.length)`.

2. Same for fiscal lookup in `fiscal_report_signatures`.

3. Add a minimum payload length check (e.g., 3000 chars). If the best signature is still below this threshold, log a warning but still include it (don't block PDF generation).

4. Add debug logs: for each resolved signature, log the chosen payload length and source report.

This is a ~15-line change in the resolver. No other files need modification — the PDF generator and form already handle the data correctly.

### Files Modified

| File | Change |
|------|--------|
| `src/utils/meetingSignatureResolver.ts` | Pick largest signature payload per user instead of most recent; add minimum-length warning |

### What Will NOT Change
- No changes to the PDF generator (it already renders correctly when given good data)
- No changes to MeetingMinutesForm
- No database changes
- No changes to fiscal reports module

