/**
 * Buyer-facing requirement aggregate status (stored on requirements.status when available).
 */
export type BuyerRequirementDisplayStatus = 'pending' | 'accepted' | 'rejected';

export function getBuyerRequirementDisplayStatus(requirement: any): BuyerRequirementDisplayStatus {
  const s = String(requirement?.status || '').toLowerCase();
  if (s === 'accepted' || s === 'rejected' || s === 'pending') return s;
  return 'pending';
}
