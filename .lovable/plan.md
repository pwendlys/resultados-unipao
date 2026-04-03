

## Plan: Delete Atas + Include Minutes Text in PDF

### 1. Delete Ata (Full Cascade)

**Problem**: Current delete only works for `draft` status, uses a simple `confirm()`, and doesn't clean up child records or storage files.

**Solution**:

**1.1 New RPC function** (`delete_meeting_minutes`):
- SECURITY DEFINER function that checks permission (creator or admin)
- Deletes children in order: signature_sources, reports, participants
- Deletes storage file if pdf_url exists (via `storage.objects`)
- Deletes main record
- Returns void or raises exception if unauthorized

**1.2 Update `MeetingMinutesList.tsx`**:
- Show delete button for ALL statuses (remove `m.status === 'draft'` condition)
- Replace `confirm()` with AlertDialog confirmation modal
- Add state for loading/deleting
- Before calling RPC, also delete storage file client-side via `supabase.storage.from('fiscal-files').remove([pdf_url])`

**1.3 Update `useMeetingMinutes.ts`**:
- Change `deleteMinutes` mutation to call the RPC instead of direct table delete

### 2. PDF Missing Minutes Text

**Problem**: The PDF generator filters paragraphs with `!p.startsWith('ATA DA')`, which correctly removes the title duplicate. However, the snapshot saved on line 227 doesn't include `minutes_text`, so if the text is somehow lost between state and generation, it won't render.

**Root cause identified**: The template text starts with `"ATA DA REUNIÃO..."` as the first paragraph. The filter on line 45 removes it. The remaining 4 paragraphs should render. But the real issue may be that the text passed to the PDF is actually empty (e.g., `minutesText` state not populated because the useEffect dependencies didn't trigger).

**Fixes**:

**2.1 `MeetingMinutesForm.tsx`** — Add safeguard before PDF generation:
- If `minutesText` is empty/whitespace, auto-generate it using the template before proceeding
- Include `minutes_text` in the snapshot object

**2.2 `meetingMinutesPdfGenerator.ts`** — Add defensive logging:
- Log `minutesText.length` at the start of `createMeetingMinutesPDF`
- If `minutesText` is empty, render a visible warning in the PDF: "Texto da ata não disponível"

### Files Modified

| File | Change |
|------|--------|
| New migration SQL | RPC `delete_meeting_minutes` + DELETE policies for child tables |
| `MeetingMinutesList.tsx` | AlertDialog confirmation, delete for all statuses, storage cleanup |
| `useMeetingMinutes.ts` | Use RPC for delete |
| `MeetingMinutesForm.tsx` | Safeguard empty text, include minutes_text in snapshot |
| `meetingMinutesPdfGenerator.ts` | Defensive empty-text handling |

### What Will NOT Change
- No changes to fiscal reports, signatures, or treasurer flows
- No changes to existing RLS on non-ATA tables
- No UI changes outside the ATA module

