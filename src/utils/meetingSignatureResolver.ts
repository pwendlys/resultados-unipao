
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

  const resolved = new Map<string, SignatureSource>();
  const missing: string[] = [];

  for (const participant of requiredParticipants) {
    const isTreasurer = participant.role === 'tesoureiro';

    if (isTreasurer) {
      // Search treasurer table first for treasurer participants
      const treasurerSig = safeTreasurerSigs.find(s => s.user_id === participant.userId);
      if (treasurerSig) {
        console.log(`[SignatureResolver] ✅ Treasurer "${participant.displayName}" found in treasurer_signatures (report: ${treasurerSig.report_id}, payload length: ${treasurerSig.signature_data?.length})`);
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

      // Fallback: check fiscal signatures table
      const fiscalSig = safeFiscalSigs.find(s => s.user_id === participant.userId);
      if (fiscalSig) {
        console.log(`[SignatureResolver] ✅ Treasurer "${participant.displayName}" found in fiscal_report_signatures (fallback)`);
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
      // Search fiscal signatures first for fiscal participants
      const fiscalSig = safeFiscalSigs.find(s => s.user_id === participant.userId);
      if (fiscalSig) {
        console.log(`[SignatureResolver] ✅ Fiscal "${participant.displayName}" found in fiscal_report_signatures (payload length: ${fiscalSig.signature_data?.length})`);
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

      // Fallback: check treasurer signatures table
      const treasurerSig = safeTreasurerSigs.find(s => s.user_id === participant.userId);
      if (treasurerSig) {
        console.log(`[SignatureResolver] ✅ Fiscal "${participant.displayName}" found in treasurer_signatures (fallback)`);
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
