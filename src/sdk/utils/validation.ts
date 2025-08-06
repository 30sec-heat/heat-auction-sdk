import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { CONSTANTS } from '../constants';
import { calculateMinNextBid } from './calculations';

// Validation functions
export function validateBidAmount(bidAmount: BN): void {
  if (bidAmount.lt(CONSTANTS.MIN_BID_AMOUNT)) {
    throw new Error(`Bid amount must be at least ${CONSTANTS.MIN_BID_AMOUNT.toString()} lamports`);
  }

  if (bidAmount.gt(CONSTANTS.MAX_BID_AMOUNT)) {
    throw new Error(`Bid amount cannot exceed ${CONSTANTS.MAX_BID_AMOUNT.toString()} lamports`);
  }
}

export async function validateOutbidAmount(
  currentAmount: BN | null,
  bidAmount: BN
): Promise<void> {
  if (!currentAmount) {
    throw new Error('No existing bid to outbid');
  }

  if (bidAmount.lte(currentAmount)) {
    throw new Error(`Bid amount must be greater than current bid of ${currentAmount.toString()} lamports`);
  }

  const minNextBid = calculateMinNextBid(currentAmount);
  if (bidAmount.lt(minNextBid)) {
    throw new Error(`Bid amount must be at least ${minNextBid.toString()} lamports to meet minimum increment`);
  }
}

export function validateSlotId(slotId: number): void {
  if (slotId < 1 || slotId > CONSTANTS.MAX_SLOTS) {
    throw new Error(`Slot ID must be between 1 and ${CONSTANTS.MAX_SLOTS}`);
  }
} 