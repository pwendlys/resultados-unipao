
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

/**
 * Resolves signatures for meeting minutes participants from the selected reports.
 * For each required participant, finds the most recent signature across the selected reports.
 */
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
  const { data: fiscalSigs } = await supabase
    .from('fiscal_report_signatures')
    .select('*')
    .in('report_id', selectedReportIds)
    .order('created_at', { ascending: false });

  // Fetch treasurer signatures from selected reports
  const { data: treasurerSigs } = await supabase
    .from('treasurer_signatures')
    .select('*')
    .in('report_id', selectedReportIds)
    .order('signed_at', { ascending: false });

  const resolved = new Map<string, SignatureSource>();
  const missing: string[] = [];

  for (const participant of requiredParticipants) {
    // Look in fiscal signatures first
    const fiscalSig = fiscalSigs?.find(s => s.user_id === participant.userId);
    if (fiscalSig) {
      resolved.set(participant.userId, {
        userId: participant.userId,
        signaturePayload: fiscalSig.signature_data,
        sourceReportId: fiscalSig.report_id,
        sourceSignatureId: fiscalSig.id,
        signedAtOriginal: fiscalSig.created_at,
        displayName: participant.displayName,
        role: participant.role === 'tesoureiro' ? 'tesoureiro' : 'fiscal',
      });
      continue;
    }

    // Look in treasurer signatures
    const treasurerSig = treasurerSigs?.find(s => s.user_id === participant.userId);
    if (treasurerSig) {
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

    missing.push(participant.displayName);
  }

  return { resolved, missing };
};
