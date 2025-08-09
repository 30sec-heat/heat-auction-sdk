import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress 
} from '@solana/spl-token';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { Bomboclat } from './idl/bomboclat';

// Constants (same as SDK)
const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

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

// Browser-compatible SDK alternative
export class BrowserHeatSDK {
  private program: Program<Bomboclat>;
  private connection: Connection;
  private wallet: any; // Browser wallet (Phantom, etc.)

  constructor(connection: Connection, wallet: any, idl: Bomboclat) {
    this.connection = connection;
    this.wallet = wallet;
    
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    this.program = new Program<Bomboclat>(idl, provider);
  }

  // Place first bid (browser-compatible)
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
        auctionState: auctionData, // You'll need to derive this
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

  // Get auction data (browser-compatible)
  async getAuctionData(auctionData: PublicKey) {
    return await this.program.account.auctionData.fetch(auctionData);
  }

  // Get auction state (browser-compatible)
  async getAuctionState(auctionData: PublicKey) {
    // You'll need to derive the auction state PDA
    const textEncoder = new TextEncoder();
    const auctionStateBytes = textEncoder.encode('auction_state');
    const [auctionStatePDA] = PublicKey.findProgramAddressSync(
      [auctionStateBytes, auctionData.toBuffer()],
      PROGRAM_ID
    );
    return await this.program.account.auctionState.fetch(auctionStatePDA);
  }

  // Get slot bid (browser-compatible)
  async getSlotBid(auctionData: PublicKey, slotId: number) {
    const [slotBidPDA] = getSlotBidPDA(auctionData, slotId);
    return await this.program.account.slotBid.fetch(slotBidPDA);
  }
}

// Example usage in browser - copy this pattern to your browser code
export async function exampleBrowserUsage(wallet: any) {
  // Connect to wallet (Phantom, etc.)
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Load IDL (you'll need to include this in your bundle)
  const idl = {} as Bomboclat; // Load your IDL here
  
  const sdk = new BrowserHeatSDK(connection, wallet, idl);
  
  // Example: Place a bid
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
