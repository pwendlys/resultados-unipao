

## Fix: Delete Ata — Use Storage API Instead of Direct SQL

### Root Cause

The `delete_meeting_minutes` RPC function includes `DELETE FROM storage.objects WHERE ...`, which Supabase forbids. Storage must be managed via the Storage API.

### Solution

Two changes — simplest approach (no edge function needed since `pdf_url` already stores the file path and the treasurer has Storage RLS permissions):

**1. Update the `delete_meeting_minutes` RPC** — Remove the `storage.objects` DELETE line. Keep the rest (permission check + cascade delete of child records + main record).

**2. Update `MeetingMinutesList.tsx`** — Before calling the RPC, delete the PDF via Storage API client-side:
```
if (deleteTarget.pdf_url) {
  await supabase.storage.from('fiscal-files').remove([deleteTarget.pdf_url]);
}
await deleteMinutes.mutateAsync(deleteTarget.id);
```

The treasurer already has `SELECT` and `INSERT` RLS on `storage.objects` for `fiscal-files` bucket. We also need a **DELETE** RLS policy so the treasurer can remove their own files.

**3. Add Storage RLS policy for DELETE** — Migration to allow tesoureiro (and admin) to delete files from the `fiscal-files` bucket.

### Files Modified

| File/Resource | Change |
|------|--------|
| Migration (SQL) | Remove `storage.objects` delete from RPC; add DELETE RLS policy on `storage.objects` |
| `MeetingMinutesList.tsx` | Delete PDF via `supabase.storage.remove()` before calling RPC |

### What Will NOT Change
- No edge function needed (client-side Storage API works with proper RLS)
- No new columns needed (`pdf_url` already stores the path)
- No changes to fiscal reports module

