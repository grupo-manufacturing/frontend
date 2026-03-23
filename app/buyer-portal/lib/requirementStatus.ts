/**
 * Buyer-facing requirement aggregate status (stored on requirements.status when available).
 */
export type BuyerRequirementDisplayStatus = 'pending' | 'accepted' | 'rejected';

export function getBuyerRequirementDisplayStatus(requirement: any): BuyerRequirementDisplayStatus {
  const s = requirement?.status;
  if (s === 'accepted' || s === 'rejected' || s === 'pending') {
    return s;
  }
  const responses = requirement?.responses || [];
  if (responses.length === 0) return 'pending';
  if (responses.some((r: any) => r.status === 'accepted')) return 'accepted';
  if (responses.every((r: any) => r.status === 'rejected')) return 'rejected';
  return 'pending';
}
