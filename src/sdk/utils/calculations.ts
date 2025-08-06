import { BN } from '@coral-xyz/anchor';
import { CONSTANTS } from '../constants';
import { AuctionDuration } from '../constants';

// Calculation functions
export function getTokenAmountForSlot(slotId: number): BN {
  if (slotId >= 1 && slotId <= 20) {
    return new BN(10_000_000).mul(new BN(10).pow(new BN(9))); // 10M tokens
  } else if (slotId >= 21 && slotId <= 60) {
    return new BN(5_000_000).mul(new BN(10).pow(new BN(9))); // 5M tokens
  } else if (slotId >= 61 && slotId <= 140) {
    return new BN(2_500_000).mul(new BN(10).pow(new BN(9))); // 2.5M tokens
  } else if (slotId >= 141 && slotId <= 300) {
    return new BN(1_000_000).mul(new BN(10).pow(new BN(9))); // 1M tokens
  } else {
    throw new Error('Invalid slot ID');
  }
}

export function calculateMinNextBid(currentBidAmount: BN): BN {
  return currentBidAmount.add(CONSTANTS.MIN_BID_INCREMENT);
}

export function calculateRefundAmount(bidAmount: BN): { refundAmount: BN; protocolFee: BN } {
  const protocolFee = bidAmount
    .mul(CONSTANTS.PROTOCOL_FEE_BPS)
    .div(CONSTANTS.BASIS_POINTS_DIVISOR);
  const refundAmount = bidAmount.sub(protocolFee);
  return { refundAmount, protocolFee };
}

export function isAuctionSuccessful(totalVolume: BN): boolean {
  return totalVolume.gte(CONSTANTS.MIN_SUCCESSFUL_RAISE);
}

export function getAuctionDurationSeconds(durationOption: AuctionDuration): number {
  switch (durationOption) {
    case AuctionDuration.ONE_MINUTE:
      return 60;
    case AuctionDuration.ONE_HOUR:
      return 3600;
    case AuctionDuration.ONE_DAY:
      return 86400;
    default:
      throw new Error('Invalid auction duration');
  }
} 