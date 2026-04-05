

## Fix: Manual Edits to Minutes Text Being Overwritten

### Problem

The `useEffect` that auto-generates the minutes text runs on every change to meeting date, type, selected fiscais, selected reports, convidados, and diligencias. It calls `setMinutesText(text)`, which **overwrites any manual edits** the user made in the textarea.

So if you paste/edit your custom text and then change anything else (e.g. toggle a report checkbox), your text is replaced by the auto-generated template.

### Fix

**File: `src/components/meeting-minutes/MeetingMinutesForm.tsx`**

Add a `manuallyEdited` flag (boolean state). When the user types in the textarea, set it to `true`. The `useEffect` only calls `setMinutesText` when `manuallyEdited` is `false`.

Add a small "Regenerar texto" button near the textarea so the user can explicitly reset to the auto-generated template if they want (this sets `manuallyEdited` back to `false`).

### Changes

1. Add state: `const [manuallyEdited, setManuallyEdited] = useState(false);`
2. In the `useEffect` — wrap `setMinutesText(text)` with `if (!manuallyEdited)`
3. In the `Textarea onChange` — add `setManuallyEdited(true)` alongside `setMinutesText`
4. Add a "Regenerar texto automaticamente" button that forces regeneration and sets `manuallyEdited = false`

### Files Modified

| File | Change |
|------|--------|
| `MeetingMinutesForm.tsx` | Add `manuallyEdited` guard to prevent overwriting manual edits; add regenerate button |

