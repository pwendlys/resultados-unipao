

## Auto-Navigation Between Diligences

### What Changes

Add diligence-focused navigation to `FiscalReviewPanel`: clicking the diligence counter scrolls to the next pending diligence, and confirming one auto-navigates to the next. A highlight animation and position indicator ("Diligencia 2 de 5") enhance orientation.

### Implementation

**File: `src/components/fiscal/FiscalReviewPanel.tsx`**

1. **New state**: `focusedDiligenceId: string | null` to track current diligence in focus.

2. **Computed list** `diligenceIds`: derived from `sortedFilteredReviews`, filtered to items where `diligenceStatus[tx_id]?.isDiligence && !myReviewsMap[tx_id]?.diligence_ack` (pending diligences the user hasn't acknowledged). Respects current filters and sort order.

3. **`navigateToDiligence(targetId)`** helper:
   - Sets `focusedDiligenceId = targetId`
   - Calls `document.getElementById('review-' + targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })`
   - Auto-clears highlight after 2s

4. **`goToNextDiligence()`**: finds next ID after `focusedDiligenceId` in `diligenceIds`, or wraps to `[0]`. If none remain, shows toast "Todas as diligencias foram revisadas".

5. **Diligence counter becomes clickable**: the existing `AlertCircle` + count section in the summary bar gets wrapped in a `<button>` with "Ir para proxima" label. Calls `goToNextDiligence()`.

6. **Position indicator**: when `focusedDiligenceId` is set and diligences exist, show small text "Diligencia X de Y" next to the counter.

7. **After `handleConfirmDiligence` succeeds**: call `goToNextDiligence()` (with a short delay to allow query invalidation to settle — use `setTimeout` of ~500ms after the mutation succeeds).

**File: `src/components/fiscal/FiscalReviewItem.tsx`**

8. **Add `id` attribute**: set `id={'review-' + review.transaction_id}` on the root `<Card>`.

9. **Add `isHighlighted` prop** (boolean): when true, apply a pulsing ring animation (`ring-2 ring-orange-400 animate-pulse` for ~2s).

10. **Auto-expand on highlight**: if `isHighlighted && isDiligence && !expanded`, call `setExpanded(true)`.

### Data Flow

```text
diligenceIds = sortedFilteredReviews
  .filter(r => diligenceStatus[r.tx_id]?.isDiligence 
            && !myReviewsMap[r.tx_id]?.diligence_ack)
  .map(r => r.transaction_id)

Click counter → goToNextDiligence() → navigateToDiligence(nextId)
Confirm diligence → mutation success → goToNextDiligence()
No more → toast "Todas as diligencias foram revisadas"
```

### Files Modified

| File | Change |
|------|--------|
| `src/components/fiscal/FiscalReviewPanel.tsx` | Add `focusedDiligenceId` state, `diligenceIds` memo, navigation helpers, clickable counter with indicator, auto-navigate after confirm |
| `src/components/fiscal/FiscalReviewItem.tsx` | Add `id` attr on Card, `isHighlighted` prop with ring animation, auto-expand on highlight |

### What Will NOT Change
- No business logic changes (diligence rules, signatures, approvals)
- No database changes
- No changes to other modules

