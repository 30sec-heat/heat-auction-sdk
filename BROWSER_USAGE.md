# Browser Usage Guide

## Why Direct Chain Calls?

The SDK uses Node.js-specific `Buffer` objects which aren't available in browsers. For browser usage, we recommend using **direct chain calls** instead of the SDK.

## Benefits of Direct Chain Calls

1. ✅ **No Buffer compatibility issues** - Works natively in browsers
2. ✅ **Smaller bundle size** - No need to bundle the entire SDK
3. ✅ **Better performance** - Direct calls are more efficient
4. ✅ **Simpler debugging** - Easier to trace issues
5. ✅ **More control** - You can optimize for your specific use case

## Security & User Experience

### 🔒 **Security - 100% Safe**

**No private keys are ever exposed or stored in your code!**

- ✅ **Wallet handles signing** - Private keys stay in user's wallet (Phantom, etc.)
- ✅ **User approval required** - Every transaction requires user to click "Approve" in their wallet
- ✅ **No key storage** - Your code never sees or stores private keys
- ✅ **Standard web3 pattern** - Same security model as all Solana dApps

### 🎯 **User Experience - Simple Button Clicks**

**No backend setup required! Everything runs in the user's browser.**

- ✅ **Just button clicks** - User clicks button → wallet popup appears → user approves → transaction sent
- ✅ **No POST requests needed** - All transactions go directly from user's browser to Solana
- ✅ **No server required** - Pure frontend implementation
- ✅ **Instant feedback** - User sees transaction status immediately

## Quick Start

### 1. Install Dependencies

```bash
npm install @solana/web3.js @coral-xyz/anchor @solana/spl-token
```

### 2. Browser-Compatible PDA Derivation

```typescript
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Browser-compatible PDA derivation using TextEncoder
function getAuctionEscrowPDA(auctionData: PublicKey): [PublicKey, number] {
  const textEncoder = new TextEncoder();
  const auctionEscrowBytes = textEncoder.encode('auction_escrow');
  return PublicKey.findProgramAddressSync(
    [auctionEscrowBytes, auctionData.toBuffer()],
    PROGRAM_ID
  );
}

function getSlotBidPDA(auctionData: PublicKey, slotId: number | BN): [PublicKey, number] {
  const textEncoder = new TextEncoder();
  const slotBidBytes = textEncoder.encode('slot_bid');
  const slotIdBN = typeof slotId === 'number' ? new BN(slotId) : slotId;
  
  // Convert BN to Uint8Array for browser compatibility
  const slotIdBytes = new Uint8Array(8);
  const slotIdNumber = slotIdBN.toNumber();
  for (let i = 0; i < 8; i++) {
    slotIdBytes[i] = (slotIdNumber >> (i * 8)) & 0xff;
  }
  
  return PublicKey.findProgramAddressSync(
    [slotBidBytes, auctionData.toBuffer(), slotIdBytes],
    PROGRAM_ID
  );
}
```

### 3. Browser-Compatible SDK Class

```typescript
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { Bomboclat } from './idl/bomboclat';

export class BrowserHeatSDK {
  private program: Program<Bomboclat>;
  private connection: Connection;
  private wallet: any;

  constructor(connection: Connection, wallet: any, idl: Bomboclat) {
    this.connection = connection;
    this.wallet = wallet;
    
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    this.program = new Program<Bomboclat>(idl, provider);
  }

  // Place first bid
  async placeFirstBid(
    auctionData: PublicKey,
    mint: PublicKey,
    slotId: number,
    bidAmount: BN
  ): Promise<string> {
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    const [auctionEscrow] = getAuctionEscrowPDA(auctionData);
    
    const bidderTokenAccount = await getAssociatedTokenAddress(
      mint,
      this.wallet.publicKey
    );

    const tx = await this.program.methods
      .placeFirstBid(new BN(slotId), bidAmount)
      .accountsStrict({
        auctionState: auctionData,
        auctionData,
        slotBid: slotBidPDA,
        bidder: this.wallet.publicKey,
        bidderTokenAccount,
        auctionEscrow,
        mint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  // Get auction data
  async getAuctionData(auctionData: PublicKey) {
    return await this.program.account.auctionData.fetch(auctionData);
  }

  // Get slot bid
  async getSlotBid(auctionData: PublicKey, slotId: number) {
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    return await this.program.account.slotBid.fetch(slotBidPDA);
  }
}
```

### 4. Usage in Your Browser App

```typescript
// In your React/Vue/Angular component
async function placeBid() {
  // Get wallet (Phantom, etc.)
  const wallet = (window as any).solana;
  
  if (!wallet) {
    alert('Please install Phantom wallet');
    return;
  }

  // Connect to wallet (this triggers wallet popup)
  await wallet.connect();
  
  // Setup connection and SDK
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const sdk = new BrowserHeatSDK(connection, wallet, idl);
  
  // Place bid (this triggers another wallet popup for transaction approval)
  const auctionData = new PublicKey('YOUR_AUCTION_DATA');
  const mint = new PublicKey('YOUR_TOKEN_MINT');
  const slotId = 1;
  const bidAmount = new BN(1 * LAMPORTS_PER_SOL); // 1 SOL
  
  try {
    const tx = await sdk.placeFirstBid(auctionData, mint, slotId, bidAmount);
    console.log('Bid placed:', tx);
  } catch (error) {
    console.error('Failed to place bid:', error);
  }
}
```

## User Flow Example

1. **User clicks "Place Bid" button**
2. **Wallet popup appears** - "Connect to Heat Auction dApp?"
3. **User clicks "Approve"** - Wallet connects to your dApp
4. **User fills bid form** - Amount, slot, etc.
5. **User clicks "Submit Bid"**
6. **Wallet popup appears** - "Approve transaction: Place bid of 1 SOL?"
7. **User clicks "Approve"** - Transaction sent to Solana
8. **Success!** - User sees confirmation, transaction hash

## Key Differences from SDK

1. **PDA Derivation**: Uses `TextEncoder` instead of `Buffer.from()`
2. **BN Conversion**: Manual conversion to `Uint8Array` for browser compatibility
3. **Wallet Integration**: Direct integration with browser wallets
4. **Bundle Size**: Much smaller, only includes what you need

## Common Operations

### Place First Bid
```typescript
const tx = await sdk.placeFirstBid(auctionData, mint, slotId, bidAmount);
```

### Get Auction Data
```typescript
const auctionData = await sdk.getAuctionData(auctionDataPubkey);
```

### Get Slot Bid
```typescript
const slotBid = await sdk.getSlotBid(auctionData, slotId);
```

### Outbid
```typescript
// Similar to placeFirstBid but with different method
const tx = await sdk.program.methods
  .outbid(new BN(slotId), bidAmount)
  .accountsStrict({...})
  .rpc();
```

## Error Handling

```typescript
try {
  const tx = await sdk.placeFirstBid(auctionData, mint, slotId, bidAmount);
  console.log('Success:', tx);
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    alert('Insufficient funds');
  } else if (error.message.includes('already bid')) {
    alert('Slot already has a bid');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Performance Tips

1. **Reuse connections** - Don't create new connections for each call
2. **Batch requests** - Group related queries together
3. **Cache results** - Cache frequently accessed data
4. **Use proper commitment** - Use 'confirmed' for most operations

## Troubleshooting

### Buffer is not defined
- ✅ Use `TextEncoder` for string encoding
- ✅ Use `Uint8Array` for byte arrays
- ✅ Avoid Node.js-specific Buffer methods

### Wallet not found
- ✅ Check if wallet is installed
- ✅ Ensure wallet is connected
- ✅ Handle wallet connection errors

### Transaction failed
- ✅ Check account balances
- ✅ Verify account permissions
- ✅ Ensure all required accounts are provided

## Migration from SDK

If you're migrating from the SDK:

1. Replace SDK imports with direct web3.js/anchor imports
2. Update PDA derivation to use browser-compatible methods
3. Replace SDK methods with direct program calls
4. Update error handling for browser-specific errors
5. Test thoroughly in browser environment

This approach gives you full control over your browser implementation while avoiding the Buffer compatibility issues.
