# BomboclatSDK - Refactored Version

This is the refactored version of the BomboclatSDK, organized into modular components for better maintainability and separation of concerns.

## Directory Structure

```
src/sdk/
├── index.ts                    # Main SDK class that composes all modules
├── constants.ts                # All constants, program IDs, and configuration
├── types/
│   ├── index.ts               # Re-exports all types
│   ├── accounts.ts            # Account interfaces (AuctionData, AuctionState, etc.)
│   ├── events.ts              # Event interfaces
│   └── common.ts              # Common types and enums
├── utils/
│   ├── pda.ts                 # PDA derivation functions
│   ├── validation.ts          # Input validation functions
│   ├── calculations.ts        # Token amounts, fees, etc.
│   └── helpers.ts             # Other utility functions
├── modules/
│   ├── base.ts                # Base module class with common properties
│   ├── auction.ts             # Auction creation and management
│   ├── bidding.ts             # Bidding operations
│   ├── treasury.ts            # Treasury-only operations
│   ├── claims.ts              # Claiming tokens and refunds
│   └── queries.ts             # Data fetching and queries
├── events/
│   ├── index.ts               # Event system main export
│   ├── parser.ts              # Event parsing logic
│   ├── listener.ts            # WebSocket event listener
│   └── emitter.ts             # Event emitter for callbacks
└── errors/
    └── index.ts               # Custom error classes
```

## Usage Examples

### Before (monolithic):
```typescript
const sdk = new BomboclatSDK(connection, wallet, idl);
await sdk.placeBid(auctionData, mint, slotId, amount);
await sdk.getAuctionState(auctionData);
sdk.onBidPlaced((event) => console.log(event));
```

### After (modular):
```typescript
const sdk = new BomboclatSDK(connection, wallet, idl);

// Bidding
await sdk.bidding.placeBid(auctionData, mint, slotId, amount);
await sdk.bidding.hostileTakeover(auctionData, mint, targetBidder);

// Queries
const auctionState = await sdk.queries.getAuctionState(auctionData);
const activeAuctions = await sdk.queries.getAllActiveAuctions();

// Events
sdk.events.onBidPlaced((event) => console.log(event));
sdk.events.onAllAuctionEvents((event) => console.log(event));

// Treasury operations
await sdk.treasury.wrapUp(auctionData, slotId);
await sdk.treasury.distributeProtocolFees(auctionData);
```

## Backward Compatibility

The refactored SDK maintains full backward compatibility with the original API. All existing methods are still available at the root level:

```typescript
// These still work exactly as before
await sdk.placeBid(auctionData, mint, slotId, amount);
await sdk.hostileTakeover(auctionData, mint, targetBidder);
await sdk.getAuctionState(auctionData);
sdk.onBidPlaced((event) => console.log(event));
```

## Module Breakdown

### 1. **constants.ts**
- Program IDs (PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID)
- Authority public keys (FEE_RECEIVER_PUBKEY, TREASURY_AUTHORITY_PUBKEY)
- Program constants (all the CONSTANTS object values)
- Auction duration enum

### 2. **types/**
- **accounts.ts**: AuctionData, AuctionState, SlotBid, Escrow interfaces
- **events.ts**: All event interfaces (AuctionInitializedEvent, BidPlacedEvent, etc.)
- **common.ts**: AuctionDuration enum, EventCallback, EventFilter types

### 3. **utils/**
- **pda.ts**: PDA derivation functions
- **validation.ts**: Input validation functions
- **calculations.ts**: Token amounts, fees, etc.
- **helpers.ts**: Other utility functions

### 4. **modules/**

#### **auction.ts** (extends BaseModule)
- `createTokenAndAuction()`
- `endAuction()` (treasury only)
- `getAuctionBiddingInfo()`

#### **bidding.ts** (extends BaseModule)
- `placeFirstBid()`
- `outbid()`
- `placeBid()` (smart bidding)
- `hostileTakeover()`
- `calculateHostileTakeoverCost()`
- `slotHasExistingBid()`
- `getCurrentBidInfo()`
- `isCurrentUserHighestBidder()`

#### **treasury.ts** (extends BaseModule)
- `wrapUp()`
- `getSolForMig()`
- `distributeProtocolFees()`
- `burnFailedAuctionTokens()`
- `claimUnclaimedTokens()`
- `closeAuctionAccounts()`

#### **claims.ts** (extends BaseModule)
- `claimAfterFinalization()`
- `getSlotInfo()`

#### **queries.ts** (extends BaseModule)
- `getAuctionData()`
- `getAuctionState()`
- `getSlotBid()`
- `getEscrow()`
- `getAllActiveAuctions()`
- `getSlotBidsForAuction()`
- `getSlotsByBidder()`
- `getEventsForAuction()`

### 5. **events/**

#### **parser.ts**
- `parseEventFromLog()`
- Event parsing logic using EventParser

#### **listener.ts**
- WebSocket connection management
- `startEventListening()`
- `stopEventListening()`
- `processLogs()`

#### **emitter.ts**
- Event listener management
- `onAuctionEvent()`
- `onAllAuctionEvents()`
- `onAuctionEvents()`
- `onEventType()`
- `offAuctionEvent()`
- `removeAllEventListeners()`

## Benefits

1. **Separation of Concerns**: Each module handles a specific domain
2. **Easier Testing**: Can test modules independently
3. **Better Maintainability**: Changes to bidding logic don't affect treasury operations
4. **Clearer API**: Methods are grouped logically
5. **Reduced File Size**: No more 2000+ line files
6. **Type Safety**: Types are centralized and reusable
7. **Extensibility**: Easy to add new modules or features

## Event System

**Note**: The event listeners currently use polling as a fallback since WebSocket events don't work. The event system is structured to support proper WebSocket implementation in the future.

## Error Handling

The SDK includes custom error classes for better error handling:

```typescript
import { BomboclatSDKError, AuctionNotFoundError, InvalidBidAmountError } from './sdk/errors';

try {
  await sdk.bidding.placeBid(auctionData, mint, slotId, amount);
} catch (error) {
  if (error instanceof InvalidBidAmountError) {
    console.log('Invalid bid amount:', error.message);
  }
}
```

## Migration Strategy

1. ✅ Create the new file structure
2. ✅ Move code piece by piece, ensuring tests pass
3. ✅ Keep the main SDK class API backward compatible
4. ✅ Update documentation with new usage patterns
5. 🔄 Optionally deprecate direct method access in favor of module access (future) 