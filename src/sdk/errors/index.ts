// Custom error classes
export class BomboclatSDKError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BomboclatSDKError';
  }
}

export class AuctionNotFoundError extends BomboclatSDKError {
  constructor(auctionData: string) {
    super(`Auction not found: ${auctionData}`, 'AUCTION_NOT_FOUND');
    this.name = 'AuctionNotFoundError';
  }
}

export class InvalidBidAmountError extends BomboclatSDKError {
  constructor(amount: string, min: string, max: string) {
    super(`Invalid bid amount: ${amount}. Must be between ${min} and ${max}`, 'INVALID_BID_AMOUNT');
    this.name = 'InvalidBidAmountError';
  }
}

export class SlotNotFoundError extends BomboclatSDKError {
  constructor(slotId: number) {
    super(`Slot not found: ${slotId}`, 'SLOT_NOT_FOUND');
    this.name = 'SlotNotFoundError';
  }
}

export class InsufficientFundsError extends BomboclatSDKError {
  constructor(required: string, available: string) {
    super(`Insufficient funds. Required: ${required}, Available: ${available}`, 'INSUFFICIENT_FUNDS');
    this.name = 'InsufficientFundsError';
  }
}

export class EventListeningError extends BomboclatSDKError {
  constructor(message: string) {
    super(`Event listening error: ${message}`, 'EVENT_LISTENING_ERROR');
    this.name = 'EventListeningError';
  }
} 