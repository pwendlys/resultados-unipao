

## Fix: Minutes Text Not Rendering in PDF

### Root Cause

The PDF generator has the text rendering code (lines 41-65), and the data is being passed correctly. The bug is in how long paragraphs are rendered:

1. **`checkPageBreak(lines.length * 6 + 10)`** checks if the ENTIRE paragraph fits. If it doesn't fit, it adds ONE page — but if the paragraph is taller than a full page (which the first content paragraph with all names certainly is), it overflows past the page boundary and becomes invisible.

2. **`doc.text(lines, margin, yPos, { align: 'justify', maxWidth: textWidth })`** renders all lines at once from a single `yPos`. jsPDF doesn't auto-paginate — text that goes past the page bottom simply disappears.

### Fix

**`src/utils/meetingMinutesPdfGenerator.ts`** — Replace the paragraph rendering block (lines 55-65) with line-by-line rendering that checks for page breaks after each line:

```
for each paragraph:
  split into lines with splitTextToSize
  for each line:
    checkPageBreak(7)        // check per-line, not per-paragraph
    doc.text(line, margin, yPos)
    yPos += 6
  yPos += 4                 // paragraph spacing
```

This ensures long paragraphs flow across pages correctly instead of being rendered as a single block that overflows.

### Files Modified

| File | Change |
|------|--------|
| `meetingMinutesPdfGenerator.ts` | Line-by-line rendering with per-line page breaks |

### What Will NOT Change
- No changes to the template, form, hooks, or any other module
- No database changes

