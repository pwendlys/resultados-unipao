
import { supabase } from '@/integrations/supabase/client';

export interface SignatureSource {
  userId: string;
  signaturePayload: string;
  sourceReportId: string;
  sourceSignatureId: string | null;
  signedAtOriginal: string;
  displayName: string;
  role: 'fiscal' | 'tesoureiro';
}

export interface SignatureResolution {
  resolved: Map<string, SignatureSource>;
  missing: string[];
}

export const resolveSignatures = async (
  requiredParticipants: { userId: string; displayName: string; role: string }[],
  selectedReportIds: string[]
): Promise<SignatureResolution> => {
  if (selectedReportIds.length === 0) {
    return {
      resolved: new Map(),
      missing: requiredParticipants.map(p => p.displayName),
    };
  }

  // Fetch fiscal signatures from selected reports
  const { data: fiscalSigs, error: fiscalError } = await supabase
    .from('fiscal_report_signatures')
    .select('*')
    .in('report_id', selectedReportIds)
    .order('created_at', { ascending: false });

  if (fiscalError) {
    console.error('[SignatureResolver] Error fetching fiscal signatures:', fiscalError.message);
  }

  // Fetch treasurer signatures from selected reports
  const { data: treasurerSigs, error: treasurerError } = await supabase
    .from('treasurer_signatures')
    .select('*')
    .in('report_id', selectedReportIds)
    .order('signed_at', { ascending: false });

  if (treasurerError) {
    console.error('[SignatureResolver] Error fetching treasurer signatures:', treasurerError.message);
  }

  const safeFiscalSigs = fiscalSigs ?? [];
  const safeTreasurerSigs = treasurerSigs ?? [];

  console.log(`[SignatureResolver] Found ${safeFiscalSigs.length} fiscal sigs, ${safeTreasurerSigs.length} treasurer sigs across ${selectedReportIds.length} reports`);

  const MIN_PAYLOAD_LENGTH = 3000;

  // Helper: pick the signature with the longest payload (most drawing content)
  const pickBest = <T extends { user_id: string; signature_data: string }>(
    sigs: T[],
    userId: string
  ): T | undefined => {
    const matches = sigs.filter(s => s.user_id === userId);
    if (matches.length === 0) return undefined;
    // Sort by payload length descending — largest = most strokes
    matches.sort((a, b) => (b.signature_data?.length ?? 0) - (a.signature_data?.length ?? 0));
    return matches[0];
  };

  const resolved = new Map<string, SignatureSource>();
  const missing: string[] = [];

  for (const participant of requiredParticipants) {
    const isTreasurer = participant.role === 'tesoureiro';

    if (isTreasurer) {
      const treasurerSig = pickBest(safeTreasurerSigs, participant.userId);
      if (treasurerSig) {
        const len = treasurerSig.signature_data?.length ?? 0;
        if (len < MIN_PAYLOAD_LENGTH) {
          console.warn(`[SignatureResolver] ⚠️ Treasurer "${participant.displayName}" best signature is only ${len} chars (possibly blank canvas)`);
        }
        console.log(`[SignatureResolver] ✅ Treasurer "${participant.displayName}" found in treasurer_signatures (report: ${treasurerSig.report_id}, payload length: ${len})`);
        resolved.set(participant.userId, {
          userId: participant.userId,
          signaturePayload: treasurerSig.signature_data,
          sourceReportId: treasurerSig.report_id,
          sourceSignatureId: treasurerSig.id,
          signedAtOriginal: treasurerSig.signed_at,
          displayName: participant.displayName,
          role: 'tesoureiro',
        });
        continue;
      }

      const fiscalSig = pickBest(safeFiscalSigs, participant.userId);
      if (fiscalSig) {
        const len = fiscalSig.signature_data?.length ?? 0;
        if (len < MIN_PAYLOAD_LENGTH) {
          console.warn(`[SignatureResolver] ⚠️ Treasurer "${participant.displayName}" fallback signature is only ${len} chars (possibly blank canvas)`);
        }
        console.log(`[SignatureResolver] ✅ Treasurer "${participant.displayName}" found in fiscal_report_signatures (fallback, payload length: ${len})`);
        resolved.set(participant.userId, {
          userId: participant.userId,
          signaturePayload: fiscalSig.signature_data,
          sourceReportId: fiscalSig.report_id,
          sourceSignatureId: fiscalSig.id,
          signedAtOriginal: fiscalSig.created_at,
          displayName: participant.displayName,
          role: 'tesoureiro',
        });
        continue;
      }
    } else {
      const fiscalSig = pickBest(safeFiscalSigs, participant.userId);
      if (fiscalSig) {
        const len = fiscalSig.signature_data?.length ?? 0;
        if (len < MIN_PAYLOAD_LENGTH) {
          console.warn(`[SignatureResolver] ⚠️ Fiscal "${participant.displayName}" best signature is only ${len} chars (possibly blank canvas)`);
        }
        console.log(`[SignatureResolver] ✅ Fiscal "${participant.displayName}" found in fiscal_report_signatures (payload length: ${len})`);
        resolved.set(participant.userId, {
          userId: participant.userId,
          signaturePayload: fiscalSig.signature_data,
          sourceReportId: fiscalSig.report_id,
          sourceSignatureId: fiscalSig.id,
          signedAtOriginal: fiscalSig.created_at,
          displayName: participant.displayName,
          role: 'fiscal',
        });
        continue;
      }

      const treasurerSig = pickBest(safeTreasurerSigs, participant.userId);
      if (treasurerSig) {
        const len = treasurerSig.signature_data?.length ?? 0;
        if (len < MIN_PAYLOAD_LENGTH) {
          console.warn(`[SignatureResolver] ⚠️ Fiscal "${participant.displayName}" fallback signature is only ${len} chars (possibly blank canvas)`);
        }
        console.log(`[SignatureResolver] ✅ Fiscal "${participant.displayName}" found in treasurer_signatures (fallback, payload length: ${len})`);
        resolved.set(participant.userId, {
          userId: participant.userId,
          signaturePayload: treasurerSig.signature_data,
          sourceReportId: treasurerSig.report_id,
          sourceSignatureId: treasurerSig.id,
          signedAtOriginal: treasurerSig.signed_at,
          displayName: participant.displayName,
          role: 'fiscal',
        });
        continue;
      }
    }

    console.warn(`[SignatureResolver] ❌ "${participant.displayName}" (${participant.role}) NOT found in any signature table`);
    missing.push(participant.displayName);
  }

  return { resolved, missing };
};
