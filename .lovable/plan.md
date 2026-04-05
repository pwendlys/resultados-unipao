

## Fix: Minutes Text Not Appearing in PDF + Professional Cover Page

### Root Cause Found

**Line 55 of `meetingMinutesPdfGenerator.ts`:**
```js
const paragraphs = minutesContent.split('\n\n').filter(p => p.trim() && !p.trim().startsWith('ATA DA'));
```

The filter `!p.trim().startsWith('ATA DA')` removes any paragraph starting with "ATA DA". When the user pastes manually-edited text that starts with "ATA DA REUNIÃO..." and uses single `\n` line breaks (not `\n\n`), the entire text is treated as ONE paragraph, which starts with "ATA DA" — so it gets **completely filtered out**. Zero paragraphs remain. The PDF skips straight to "RELATÓRIOS APROVADOS".

### Solution

Two changes in one file + copy the logo image:

**1. Copy the uploaded Unipao logo** to `src/assets/unipao-logo.png` for use in the PDF cover page.

**2. Rewrite `meetingMinutesPdfGenerator.ts`** with:

- **Remove the `startsWith('ATA DA')` filter** — split on both `\n\n` and `\n` to handle all paragraph styles; no content filtering.

- **Page 1 — Cover page** with:
  - Unipao logo (imported as base64 from assets)
  - Large title "ATA DO CONSELHO FISCAL"
  - Subtitle "Cooperativa Unipao"
  - Meeting date and competencies from `data.title`

- **Page 2+ — "TEXTO DA ATA"** section:
  - Section title
  - Full `minutesText` rendered line-by-line with per-line page breaks
  - Paragraph spacing preserved

- **Next — "RELATORIOS APROVADOS"** (same page if fits, or new page)

- **Next — "DILIGENCIAS CONSOLIDADAS"** (if applicable)

- **New page — "ASSINATURAS"** (unchanged logic)

- **Validation**: if `minutesText.length < 50`, throw error to block PDF generation. Add `console.log` with text length for debugging.

### Files Modified

| File | Change |
|------|--------|
| `src/assets/unipao-logo.png` | Copy uploaded logo |
| `src/utils/meetingMinutesPdfGenerator.ts` | Remove broken filter, add cover page with logo, reorder sections, add validation |

### What Will NOT Change
- No changes to MeetingMinutesForm, hooks, template, or any other module
- No database changes
- No changes to fiscal reports PDF generation

